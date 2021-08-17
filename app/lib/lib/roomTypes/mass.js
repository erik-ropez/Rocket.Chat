import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { ChatRoom, Subscriptions } from '../../../models';
import { openRoom, modal } from '../../../ui-utils';
import { getUserPreference, RoomTypeConfig, RoomTypeRouteConfig, RoomSettingsEnum, RoomMemberActions, UiTextContext } from '../../../utils';
import { hasPermission, hasAtLeastOnePermission } from '../../../authorization';
import { settings } from '../../../settings';
import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';
import { getAvatarURL } from '../../../utils/lib/getAvatarURL';
import { callbacks } from '../../../callbacks';
import { promises } from '../../../promises/lib/promises';
import { t } from '../../../utils/lib/tapi18n';

export class MassMessageRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'mass',
			path: '/mass/:rid/:tab?/:context?',
		});
	}

	action(params) {
		return openRoom('m', params.rid);
	}

	link(sub) {
		return { rid: sub.rid || sub._id || sub.name };
	}
}

export class MassMessageRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'm',
			order: 50,
			icon: 'at',
			label: 'Mass_Message',
			route: new MassMessageRoomRoute(),
		});
	}


	getIcon(roomData) {
		return 'balloon';
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
		return t('Mass_Message');
	}

	secondaryRoomName(roomData) {
		return t('Mass_Message');
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

	getNotificationDetails(room, user, notificationMessage) {
		if (!Meteor.isServer) {
			return {};
		}

		return {
			title: this.roomName(room),
			text: `${ (settings.get('UI_Use_Real_Name') && user.name) || user.username }: ${ notificationMessage }`,
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

		return getAvatarURL({ username: roomData.uids.length + roomData.usernames.join() });
	}

	includeInDashboard() {
		return false;
	}

	isGroupChat(room) {
		return true;
	}

	canSendMessage(roomId) {
		const room = ChatRoom.findOne({ _id: roomId, t: 'm' }, { fields: { u: 1 } });
		return room.u._id == Meteor.userId();
	}
}

Meteor.startup(function() {
	promises.add('onClientMessageReceived', function(message) {
		const room = ChatRoom.findOne({ _id: message.rid });

		if (room.t == 'm') {
			modal.open({
				title: t('Mass_Message'),
				text:t('Mass_Message_was_sent'),
				type: 'info',
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('OK'),
				closeOnConfirm: true,
				html: false,
			});

			FlowRouter.go('home');

			return Promise.resolve(null);
		}

		return Promise.resolve(message);
	});
});
