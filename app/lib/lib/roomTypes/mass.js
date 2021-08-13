import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { ChatRoom, Subscriptions } from '../../../models';
import { openRoom } from '../../../ui-utils';
import { getUserPreference, RoomTypeConfig, RoomTypeRouteConfig, RoomSettingsEnum, RoomMemberActions, UiTextContext } from '../../../utils';
import { hasPermission, hasAtLeastOnePermission } from '../../../authorization';
import { settings } from '../../../settings';
import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';
import { getAvatarURL } from '../../../utils/lib/getAvatarURL';

export class MassMessageRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'mass',
			path: '/mass',
		});
	}

	action(params) {
		return openRoom('m', 'Mass');
	}

	link(sub) {
		return { };
	}
}

export class MassMessageRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'm',
			order: 50,
			label: 'Mass_Messages',
			route: new MassMessageRoomRoute(),
		});
	}


	getIcon(roomData) {
		if (this.isGroupChat(roomData)) {
			return 'balloon';
		}
		return this.icon;
	}

	findRoom(identifier) {
		const query = {
			t: 'm',
			$or: [
				{ name: identifier },
				{ rid: identifier },
			],
		};

		const subscription = Subscriptions.findOne(query);
		if (subscription && subscription.rid) {
			return ChatRoom.findOne(subscription.rid);
		}
	}

	roomName(roomData) {
		// this function can receive different types of data
		// if it doesn't have fname and name properties, should be a Room object
		// so, need to find the related subscription
		const subscription = roomData && (roomData.fname || roomData.name)
			? roomData
			: Subscriptions.findOne({ rid: roomData._id });

		if (subscription === undefined) {
			return;
		}

		if (settings.get('UI_Use_Real_Name') && subscription.fname) {
			return subscription.fname;
		}

		return subscription.name;
	}

	secondaryRoomName(roomData) {
		if (settings.get('UI_Use_Real_Name')) {
			const subscription = Subscriptions.findOne({ rid: roomData._id }, { fields: { name: 1 } });
			return subscription && subscription.name;
		}
	}

	condition() {
		const groupByType = getUserPreference(Meteor.userId(), 'sidebarGroupByType');
		return groupByType && hasAtLeastOnePermission(['view-d-room', 'view-joined-room']);
	}

	getUserStatus(roomId) {
		const subscription = Subscriptions.findOne({ rid: roomId });
		if (subscription == null) {
			return;
		}

		return Session.get(`user_${ subscription.name }_status`);
	}

	getUserStatusText(roomId) {
		const subscription = Subscriptions.findOne({ rid: roomId });
		if (subscription == null) {
			return;
		}

		return Session.get(`user_${ subscription.name }_status_text`);
	}

	allowRoomSettingChange(room, setting) {
		return false;
	}

	allowMemberAction(room, action) {
		return false;
	}

	enableMembersListProfile() {
		return true;
	}

	userDetailShowAll(/* room */) {
		return true;
	}

	getUiText(context) {
		switch (context) {
			case UiTextContext.HIDE_WARNING:
				return 'Hide_Private_Warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Leave_Private_Warning';
			default:
				return '';
		}
	}

	/**
	 * Returns details to use on notifications
	 *
	 * @param {object} room
	 * @param {object} user
	 * @param {string} notificationMessage
	 * @return {object} Notification details
	 */
	getNotificationDetails(room, user, notificationMessage) {
		if (!Meteor.isServer) {
			return {};
		}

		if (this.isGroupChat(room)) {
			return {
				title: this.roomName(room),
				text: `${ (settings.get('UI_Use_Real_Name') && user.name) || user.username }: ${ notificationMessage }`,
			};
		}

		return {
			title: (settings.get('UI_Use_Real_Name') && user.name) || user.username,
			text: notificationMessage,
		};
	}

	getAvatarPath(roomData, subData) {
		if (!roomData && !subData) {
			return '';
		}

		// if coming from sidenav search
		if (roomData.name && roomData.avatarETag) {
			return getUserAvatarURL(roomData.name, roomData.avatarETag);
		}

		if (this.isGroupChat(roomData)) {
			return getAvatarURL({ username: roomData.uids.length + roomData.usernames.join() });
		}

		const sub = subData || Subscriptions.findOne({ rid: roomData._id }, { fields: { name: 1 } });

		if (sub && sub.name) {
			const user = Meteor.users.findOne({ username: sub.name }, { fields: { username: 1, avatarETag: 1 } });
			return getUserAvatarURL(user?.username || sub.name, user?.avatarETag);
		}

		if (roomData) {
			return getUserAvatarURL(roomData.name || this.roomName(roomData)); // rooms should have no name for direct messages...
		}
	}

	includeInDashboard() {
		return false;
	}

	isGroupChat(room) {
		return true;
	}
}
