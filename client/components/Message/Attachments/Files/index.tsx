import React, { FC } from 'react';
import { Meteor } from 'meteor/meteor';

import { isFileAudioAttachment } from '../../../../../definition/IMessage/MessageAttachment/Files/AudioAttachmentProps';
import { FileAttachmentProps } from '../../../../../definition/IMessage/MessageAttachment/Files/FileAttachmentProps';
import { isFileImageAttachment } from '../../../../../definition/IMessage/MessageAttachment/Files/ImageAttachmentProps';
import { isFileVideoAttachment } from '../../../../../definition/IMessage/MessageAttachment/Files/VideoAttachmentProps';
import { AudioAttachment } from './AudioAttachment';
import { GenericFileAttachment } from './GenericFileAttachment';
import { ImageAttachment } from './ImageAttachment';
import { VideoAttachment } from './VideoAttachment';

export const FileAttachment: FC<FileAttachmentProps> = (attachment) => {
	let owner = false;
	if (attachment.locked) {
		if (attachment.message.u._id == Meteor.userId()) {
			owner = true;
		}
	}

	if (isFileImageAttachment(attachment)) {
		return <ImageAttachment {...attachment} owner={owner} />;
	}
	if (isFileAudioAttachment(attachment)) {
		return <AudioAttachment {...attachment} owner={owner} />;
	}
	if (isFileVideoAttachment(attachment)) {
		return <VideoAttachment {...attachment} owner={owner} />;
	}
	// if (isFilePDFAttachment(attachment)) { return <PDFAttachment {...attachment} />; }

	return <GenericFileAttachment {...attachment} />;
};

export { GenericFileAttachment, ImageAttachment, VideoAttachment };
