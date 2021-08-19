import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import moment from 'moment';

import { Messages, Rooms } from '../../../models';
import { settings } from '../../../settings';
import { hasPermission, canSendMessage } from '../../../authorization/server';
import { updateMessage } from '../functions';
import { callbacks } from '../../../callbacks';

Meteor.methods({
	unlockMessage(message) {
		check(message, Match.ObjectIncluding({ _id: String }));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'unlockMessage' });
		}

		const originalMessage = Messages.findOneById(message._id);

		if (!originalMessage || !originalMessage._id) {
			return;
		}
		if (!originalMessage.ppv || !originalMessage.ppv.locked) {
			return;
		}

		const _hasPermission = hasPermission(Meteor.userId(), 'edit-message', message.rid);
		const editAllowed = settings.get('Message_AllowEditing');
		const editOwn = originalMessage.u && originalMessage.u._id === Meteor.userId();

		if (!_hasPermission && !editAllowed && !editOwn) {
			throw new Meteor.Error('error-action-not-allowed', 'Message editing not allowed', { method: 'unlockMessage', action: 'Message_editing' });
		}

		const user = Meteor.users.findOne(Meteor.userId());
		canSendMessage(message.rid, { uid: user._id, ...user });

		message.u = originalMessage.u;

		message.ppv = originalMessage.ppv;
		message.ppv.locked = false;

		const ppvContent = originalMessage._ppvContent;

		message.file = originalMessage.file;
		message.file._id = ppvContent.file._id;

		message.attachments = originalMessage.attachments;
		for (const attachmentIndex in ppvContent.attachments) {
			const attachment = message.attachments[attachmentIndex];
			const ppvAttachment = ppvContent.attachments[attachmentIndex];

			attachment.title_link = ppvAttachment.title_link;

			for (const prop of ['image_url', 'video_url', 'audio_url']) {
				if (ppvAttachment[prop]) {
					attachment[prop] = ppvAttachment[prop];
				}
			}
		}

		const tempid = message._id;
		delete message._id;

		Messages.update({ _id: tempid }, { $set: message });

		const room = Rooms.findOneById(message.rid);

		Meteor.defer(function() {
			callbacks.run('afterSaveMessage', Messages.findOneById(tempid), room, user._id);
		});
	},
});
