import { Box, Button } from '@rocket.chat/fuselage';
import React, { FC, useCallback, MouseEvent } from 'react';

import { VideoAttachmentProps } from '../../../../../definition/IMessage/MessageAttachment/Files/VideoAttachmentProps';
import MarkdownText from '../../../MarkdownText';
import Attachment from '../Attachment';
import { useMediaUrl } from '../context/AttachmentContext';
import { useCollapse } from '../hooks/useCollapse';

import { fireGlobalEvent } from '../../../../../app/ui-utils';

export const VideoAttachment: FC<VideoAttachmentProps> = ({
	title,
	video_url: url,
	video_type: type,
	collapsed: collapsedDefault = false,
	video_size: size,
	description,
	title_link: link,
	title_link_download: hasDownload,
	message,
	locked,
	owner,
}) => {
	const [collapsed, collapse] = useCollapse(collapsedDefault);
	// useTranslation();
	const getURL = useMediaUrl();

	const onPpvClick = useCallback((event: MouseEvent<HTMLOrSVGElement>) => {
		event.preventDefault();
		return fireGlobalEvent('click-pay-per-view', { message });
	}, [message]);

	const onUnlockClick = useCallback((event: MouseEvent<HTMLOrSVGElement>) => {
		event.preventDefault();
		Meteor.call('unlockMessage', {
			_id: message._id,
			rid: message.rid,
		});
	}, [message]);

	return (
		<Attachment>
			<Attachment.Row>
				<Attachment.Title>{title}</Attachment.Title>
				{size && <Attachment.Size size={size} />}
				{collapse}
				{hasDownload && !locked && link && <Attachment.Download title={title} href={getURL(link)} />}
			</Attachment.Row>
			{!collapsed && (
				<Attachment.Content width='full'>
					{locked && owner && (
						<Button className='unlock-button' onClick={onUnlockClick} borderWidth='0' p='0'>Unlock</Button>
					)}
					{locked && !owner && (
						<Button className='unlock-button' onClick={onPpvClick} borderWidth='0' p='0'>Pay ${message.ppv.price}</Button>
					)}
					{!locked && (
						<Box is='video' width='full' controls>
							<source src={getURL(url)} type={type} />
						</Box>
					)}
					{description && (
						<Attachment.Details is='figcaption'>
							<MarkdownText parseEmoji variant='inline' content={description} />
						</Attachment.Details>
					)}
				</Attachment.Content>
			)}
		</Attachment>
	);
};
