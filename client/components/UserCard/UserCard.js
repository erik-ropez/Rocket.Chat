import { Box, ActionButton, Skeleton } from '@rocket.chat/fuselage';
import React, { forwardRef } from 'react';

import MarkdownText from '../MarkdownText';
import * as Status from '../UserStatus';
import UserAvatar from '../avatar/UserAvatar';
import Info from './Info';
import Roles from './Roles';
import UserCardContainer from './UserCardContainer';
import Username from './Username';

const clampStyle = {
	display: '-webkit-box',
	overflow: 'hidden',
	WebkitLineClamp: 3,
	WebkitBoxOrient: 'vertical',
	wordBreak: 'break-all',
};

const UserCard = forwardRef(function UserCard(
	{
		className,
		style,
		open,
		name = <Skeleton width='100%' />,
		username,
		etag,
		customStatus = <Skeleton width='100%' />,
		roles = (
			<>
				<Skeleton width='32%' mi='x2' />
				<Skeleton width='32%' mi='x2' />
				<Skeleton width='32%' mi='x2' />
			</>
		),
		bio = (
			<>
				<Skeleton width='100%' />
				<Skeleton width='100%' />
				<Skeleton width='100%' />
			</>
		),
		status = <Status.Offline />,
		actions,
		localTime = <Skeleton width='100%' />,
		onClose,
		nickname,
		t = (e) => e,
	},
	ref,
) {
	return (
		<UserCardContainer className={className} ref={ref} style={style}>
			<Box pb='x24' pi='x12'>
				<UserAvatar username={username} etag={etag} size='x124' />
				{actions && (
					<Box flexGrow={0} display='flex' mb='x8' align='center' justifyContent='center'>
						{actions}
					</Box>
				)}
			</Box>
			<Box pb='x24' className='user-card-info' display='flex' flexDirection='column' flexGrow={1} flexShrink={1} mis='x24' width='1px'>
				<Box mb="x4" withTruncatedText display='flex'>
					<Username status={status} name={name} title={username !== name ? username : undefined} />
					{nickname && (
						<Box title={t('Nickname')} color='hint' mis='x8' fontScale='p1' withTruncatedText>
							({nickname})
						</Box>
					)}
				</Box>
				{customStatus && (
					<Info mb="x4" className="user-card-info-status">
						{typeof customStatus === 'string' ? (
							<MarkdownText content={customStatus} />
						) : (
							customStatus
						)}
					</Info>
				)}
				<Info mb="x4">{localTime}</Info>
				{bio && (
					<Info mb="x4" withTruncatedText={false} style={clampStyle} height='x60'>
						{typeof bio === 'string' ? <MarkdownText content={bio} /> : bio}
					</Info>
				)}
				{open && (
					<Info mb="x4" className="user-card-info-open-profile">
						<a onClick={open}>{t('See_full_profile')}</a>
					</Info>
				)}
			</Box>
			{onClose && (
				<Box className='user-card-close'>
					<ActionButton ghost icon='cross' onClick={onClose} />
				</Box>
			)}
		</UserCardContainer>
	);
});

export default UserCard;
