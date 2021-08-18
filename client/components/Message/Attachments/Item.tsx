import React, { FC, memo } from 'react';

import { isFileAttachment } from '../../../../definition/IMessage/MessageAttachment/Files/FileAttachmentProps';
import { FileProp } from '../../../../definition/IMessage/MessageAttachment/Files/FileProp';
import { MessageAttachmentBase } from '../../../../definition/IMessage/MessageAttachment/MessageAttachmentBase';
import { isQuoteAttachment } from '../../../../definition/IMessage/MessageAttachment/MessageQuoteAttachment';
import DefaultAttachment from './DefaultAttachment';
import { FileAttachment } from './Files';
import { QuoteAttachment } from './QuoteAttachment';

const Item: FC<{ attachment: MessageAttachmentBase; file?: FileProp | undefined; message?: Object | undefined | null; locked?: Boolean | undefined }> = ({
	attachment,
	file,
	message,
	locked,
}) => {
	if (isFileAttachment(attachment) && file) {
		return <FileAttachment {...attachment} file={file} message={message} locked={locked} />;
	}

	if (isQuoteAttachment(attachment)) {
		return <QuoteAttachment {...attachment} />;
	}

	return <DefaultAttachment {...(attachment as any)} />;
};

export default memo(Item);
