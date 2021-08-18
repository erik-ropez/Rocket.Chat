import React, { FC } from 'react';

import { FileProp } from '../../../../definition/IMessage/MessageAttachment/Files/FileProp';
import { MessageAttachmentBase } from '../../../../definition/IMessage/MessageAttachment/MessageAttachmentBase';
import { useBlockRendered } from '../hooks/useBlockRendered';
import Item from './Item';

const Attachments: FC<{ attachments: Array<MessageAttachmentBase>; file?: FileProp; message?: Object | undefined | null; locked?: Boolean | undefined }> = ({
	attachments = null,
	file,
	message = null,
	locked = false,
}): any => {
	const { className, ref } = useBlockRendered();
	return (
		<>
			<div className={className} ref={ref as any} />
			{attachments &&
				attachments.map((attachment, index) => (
					<Item key={index} file={file} attachment={attachment} message={message} locked={locked} />
				))}
		</>
	);
};

export default Attachments;
