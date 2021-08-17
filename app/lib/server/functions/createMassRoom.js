import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Meteor } from 'meteor/meteor';

import { Apps } from '../../../apps/server';
import { callbacks } from '../../../callbacks/server';
import { Rooms, Subscriptions } from '../../../models/server';
import { settings } from '../../../settings/server';
import { getDefaultSubscriptionPref } from '../../../utils/server';

const generateSubscription = (fname, name, user, extra) => ({
	alert: false,
	unread: 0,
	userMentions: 0,
	groupMentions: 0,
	...user.customFields && { customFields: user.customFields },
	...getDefaultSubscriptionPref(user),
	...extra,
	t: 'm',
	fname,
	name,
	u: {
		_id: user._id,
		username: user.username,
	},
});

const getFname = (members) => members.map(({ name, username }) => name || username).join(', ');
const getName = (members) => members.map(({ username }) => username).join(', ');

export const createMassRoom = function(members, owner, roomExtraData = {}, options = {}) {
	if (members.length > (settings.get('DirectMesssage_maxUsers') || 1)) {
		throw new Error('error-direct-message-max-user-exceeded');
	}

	const sortedMembers = members.sort((u1, u2) => (u1.name || u1.username).localeCompare(u2.name || u2.username));

	const usernames = sortedMembers.map(({ username }) => username);
	const uids = members.map(({ _id }) => _id).sort();

	// Deprecated: using users' _id to compose the room _id is deprecated
	const room = Rooms.findOneMassRoomContainingAllUserIDs(owner._id, uids, { fields: { _id: 1 } });

	const isNewRoom = !room;

	const roomInfo = {
		// ...uids.length === 2 && { _id: uids.join('') }, // Deprecated: using users' _id to compose the room _id is deprecated
		t: 'm',
		usernames,
		usersCount: members.length,
		msgs: 0,
		ts: new Date(),
		uids,
		u: {
			_id: owner._id,
			username: owner.username,
		},
		...roomExtraData,
	};

	if (isNewRoom) {
		roomInfo._USERNAMES = usernames;

		const prevent = Promise.await(Apps.triggerEvent('IPreRoomCreatePrevent', roomInfo).catch((error) => {
			if (error instanceof AppsEngineException) {
				throw new Meteor.Error('error-app-prevented', error.message);
			}

			throw error;
		}));
		if (prevent) {
			throw new Meteor.Error('error-app-prevented', 'A Rocket.Chat App prevented the room creation.');
		}

		let result;
		result = Promise.await(Apps.triggerEvent('IPreRoomCreateExtend', roomInfo));
		result = Promise.await(Apps.triggerEvent('IPreRoomCreateModify', result));

		if (typeof result === 'object') {
			Object.assign(roomInfo, result);
		}

		delete roomInfo._USERNAMES;
	}

	const rid = room?._id || Rooms.insert(roomInfo);

	Subscriptions.upsert({ rid, 'u._id': owner._id }, {
		$set: { open: true },
		$setOnInsert: generateSubscription(owner.username, owner.username, owner, { ...options.subscriptionExtra }),
	});

	// If the room is new, run a callback
	if (isNewRoom) {
		const insertedRoom = Rooms.findOneById(rid);

		callbacks.run('afterCreateMassRoom', insertedRoom, { members });

		Apps.triggerEvent('IPostRoomCreate', insertedRoom);
	}

	return {
		_id: rid,
		usernames,
		t: 'm',
		inserted: isNewRoom,
	};
};
