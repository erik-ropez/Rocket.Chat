import React, { FC, useCallback, MouseEvent } from 'react';
import { Button } from '@rocket.chat/fuselage';

import { ImageAttachmentProps } from '../../../../../definition/IMessage/MessageAttachment/Files/ImageAttachmentProps';
import MarkdownText from '../../../MarkdownText';
import Attachment from '../Attachment';
import Image from '../components/Image';
import { useMediaUrl } from '../context/AttachmentContext';
import { useCollapse } from '../hooks/useCollapse';
import { useLoadImage } from '../hooks/useLoadImage';

import { fireGlobalEvent } from '../../../../../app/ui-utils';

export const ImageAttachment: FC<ImageAttachmentProps> = ({
	title,
	image_url: url,
	image_preview: imagePreview,
	collapsed: collapsedDefault = false,
	image_size: size,
	image_dimensions: imageDimensions = {
		height: 360,
		width: 480,
	},
	description,
	title_link: link,
	title_link_download: hasDownload,
	message,
	locked,
}) => {
	const [loadImage, setLoadImage] = useLoadImage();
	const [collapsed, collapse] = useCollapse(collapsedDefault);
	const getURL = useMediaUrl();

	const previewUrl = `data:image/png;base64,${imagePreview}`;

	const onPpvClick = useCallback((event: MouseEvent<HTMLOrSVGElement>) => {
		event.preventDefault();
		return fireGlobalEvent('click-pay-per-view', { message });
	}, [message]);

	return (
		<Attachment>
			{description && <MarkdownText parseEmoji variant='inline' content={description} />}
			<Attachment.Row>
				<Attachment.Title>{title}</Attachment.Title>
				{size && <Attachment.Size size={size} />}
				{collapse}
				{hasDownload && !locked && link && <Attachment.Download title={title} href={getURL(link)} />}
			</Attachment.Row>
			{!collapsed && (
				<Attachment.Content>
					{locked && (
						<Button onClick={onPpvClick} borderWidth='0' p='0'>
							<Image
								{...imageDimensions}
								loadImage={loadImage}
								setLoadImage={setLoadImage}
								src={previewUrl}
								previewUrl={previewUrl}
								galleryItem={false}
							/>
						</Button>
					)}
					{!locked && (
						<Image
							{...imageDimensions}
							loadImage={loadImage}
							setLoadImage={setLoadImage}
							src={getURL(url)}
							previewUrl={previewUrl}
						/>
					)}
				</Attachment.Content>
			)}
		</Attachment>
	);
};
