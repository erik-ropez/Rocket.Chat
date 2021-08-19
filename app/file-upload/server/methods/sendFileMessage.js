import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';
import _ from 'underscore';

import { Uploads } from '../../../models';
import { Rooms } from '../../../models/server/raw';
import { callbacks } from '../../../callbacks';
import { FileUpload } from '../lib/FileUpload';
import { canAccessRoom } from '../../../authorization/server/functions/canAccessRoom';

Meteor.methods({
	async sendFileMessage(roomId, store, file, msgData = {}) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendFileMessage' });
		}

		const room = await Rooms.findOneById(roomId);
		const user = Meteor.user();

		if (user?.type !== 'app' && canAccessRoom(room, user) !== true) {
			return false;
		}

		check(msgData, {
			avatar: Match.Optional(String),
			emoji: Match.Optional(String),
			alias: Match.Optional(String),
			groupable: Match.Optional(Boolean),
			msg: Match.Optional(String),
			tmid: Match.Optional(String),
			price: Match.Optional(String),
		});

		Uploads.updateFileComplete(file._id, Meteor.userId(), _.omit(file, '_id'));

		const fileUrl = FileUpload.getPath(`${ file._id }/${ encodeURI(file.name) }`);

		const attachment = {
			title: file.name,
			type: 'file',
			description: file.description,
			title_link: fileUrl,
			title_link_download: true,
		};

		if (/^image\/.+/.test(file.type)) {
			attachment.image_url = fileUrl;
			attachment.image_type = file.type;
			attachment.image_size = file.size;
			if (file.identify && file.identify.size) {
				attachment.image_dimensions = file.identify.size;
			}
			try {
				attachment.image_preview = await FileUpload.resizeImagePreview(file);
			} catch (e) {
				delete attachment.image_url;
				delete attachment.image_type;
				delete attachment.image_size;
				delete attachment.image_dimensions;
			}
		} else if (/^audio\/.+/.test(file.type)) {
			attachment.audio_url = fileUrl;
			attachment.audio_type = file.type;
			attachment.audio_size = file.size;
		} else if (/^video\/.+/.test(file.type)) {
			attachment.video_url = fileUrl;
			attachment.video_type = file.type;
			attachment.video_size = file.size;
		}

		let msg = Object.assign({
			_id: Random.id(),
			rid: roomId,
			ts: new Date(),
			msg: '',
			file: {
				_id: file._id,
				name: file.name,
				type: file.type,
			},
			groupable: false,
			attachments: [attachment],
		}, msgData);

		if (msgData.price) {
			msg.ppv = {
				locked: true,
				price: msgData.price,
			};

			delete msgData.price;

			msg._ppvContent = {
				file: {
					_id: msg.file._id,
				},
				attachments: [],
			};

			delete msg.file._id;

			for (const attachment of msg.attachments) {
				const ppvAttachment = {
					title_link: attachment.title_link,
				};

				delete attachment.title_link;

				for (const prop of ['image_url', 'video_url', 'audio_url']) {
					if (attachment[prop]) {
						ppvAttachment[prop] = attachment[prop];
						attachment[prop] = '';
					}
				}

				msg._ppvContent.attachments.push(ppvAttachment);
			}
		}

		msg = Meteor.call('sendMessage', msg);

		Meteor.defer(() => callbacks.run('afterFileUpload', { user, room, message: msg }));

		return msg;
	},
});
