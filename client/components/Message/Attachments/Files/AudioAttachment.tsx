import React, { FC, useCallback, MouseEvent } from 'react';
import { Button } from '@rocket.chat/fuselage';

import { AudioAttachmentProps } from '../../../../../definition/IMessage/MessageAttachment/Files/AudioAttachmentProps';
import MarkdownText from '../../../MarkdownText';
import Attachment from '../Attachment';
import { useMediaUrl } from '../context/AttachmentContext';
import { useCollapse } from '../hooks/useCollapse';

import { fireGlobalEvent } from '../../../../../app/ui-utils';

export const AudioAttachment: FC<AudioAttachmentProps> = ({
	title,
	audio_url: url,
	audio_type: type,
	collapsed: collapsedDefault = false,
	audio_size: size,
	description,
	title_link: link,
	title_link_download: hasDownload,
	message,
	locked,
}) => {
	const [collapsed, collapse] = useCollapse(collapsedDefault);
	const getURL = useMediaUrl();

	const onPpvClick = useCallback((event: MouseEvent<HTMLOrSVGElement>) => {
		event.preventDefault();
		return fireGlobalEvent('click-pay-per-view', { message });
	}, [message]);

	return (
		<Attachment>
			<MarkdownText parseEmoji variant='inline' content={description} />
			<Attachment.Row>
				<Attachment.Title>{title}</Attachment.Title>
				{size && <Attachment.Size size={size} />}
				{collapse}
				{hasDownload && !locked && link && <Attachment.Download title={title} href={getURL(link)} />}
			</Attachment.Row>
			{!collapsed && (
				<Attachment.Content border='none'>
					{locked && (
						<Button onClick={onPpvClick} borderWidth='0' p='0'>Unlock</Button>
					)}
					{!locked && (
						<audio controls>
							<source src={getURL(url)} type={type} />
						</audio>
					)}
				</Attachment.Content>
			)}
		</Attachment>
	);
};
