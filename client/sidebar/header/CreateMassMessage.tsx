import { Box, Modal, ButtonGroup, Button, TextInput, Field, RadioButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FC, useState, memo, useCallback, ChangeEvent } from 'react';

import { IUser } from '../../../definition/IUser';
import UserAutoCompleteMultiple from '../../components/UserAutoCompleteMultiple';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointActionExperimental } from '../../hooks/useEndpointAction';
import { fireGlobalEvent } from '../../../app/ui-utils';
import axios from 'axios';
import { goToRoomById } from '../../lib/goToRoomById';
import { settings } from '/app/settings/client';

type Username = IUser['username'];

type CreateMassMessageProps = {
	onClose: () => void;
};

const CreateMassMessage: FC<CreateMassMessageProps> = ({ onClose }) => {
	const t = useTranslation();
	const [users, setUsers] = useState<Array<Username>>([]);
	const [usersEntry, setUsersEntry] = useState('manual');

	let usersEntryForEvent = null;

	const createMass = useEndpointActionExperimental('POST', 'mm.create');

	const onChangeUsers = useMutableCallback((value: Username, action: string) => {
		if (!action) {
			if (users.includes(value)) {
				return;
			}
			return setUsers([...users, value]);
		}
		setUsers(users.filter((current) => current !== value));
	});

	const onCreate = useMutableCallback(async () => {
		try {
			const {
				room: { rid },
			} = await createMass({ usernames: users.join(',') });

			goToRoomById(rid);
			onClose();
		} catch (error) {
			console.warn(error);
		}
	});

	const initRocketEffectEventListener = async (e) => {
		if (typeof e.data !== 'object' || typeof e.data.externalCommand !== 'string') {
			return;
		}

		if (e.data.externalCommand === 'init-rocket-effect') {
			window.removeEventListener('message', initRocketEffectEventListener);

			const endpoints = {
				subscribers: '/api/customer/user/subscriber',
				followers: '/api/customer/user/followers',
			};

			if (endpoints[usersEntryForEvent]) {
				const { data: { data: users } } = await axios.get(settings.get('Gmh_Url') + endpoints[usersEntryForEvent], {
					headers: {
						'X-Authorization': `Bearer ${e.data.token}`
					},
					withCredentials: true,
				});
				setUsers(users.map(u => u.username));
			}
		}
	};

	const handleUsersEntryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setUsers([])

		setUsersEntry(event.currentTarget.value);
		usersEntryForEvent = event.currentTarget.value;

		if (event.currentTarget.value == 'subscribers' || event.currentTarget.value == 'followers') {
			window.addEventListener('message', initRocketEffectEventListener);
			fireGlobalEvent('init-rocket-effect');
		}
	}, []);

	return (
		<Modal className='messages-modal'>
			<Modal.Header>
				<Modal.Title>{t('Mass_Messages')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>

				<Box display='flex' flexDirection='row' width='full' flexWrap='wrap'>
					<Field mie='x16' width='unset'>
						<Field.Row>
							<RadioButton
								id='usersManualEntry'
								name='usersEntry'
								value='manual'
								onChange={handleUsersEntryChange}
								checked={usersEntry === 'manual'}
							/>
							<Field.Label htmlFor='usersManualEntry'>{t('Mass_message_manual_entry')}</Field.Label>
						</Field.Row>
					</Field>
					<Field mie='x16' width='unset'>
						<Field.Row>
							<RadioButton
								id='usersSubscribers'
								name='usersEntry'
								value='subscribers'
								onChange={handleUsersEntryChange}
								checked={usersEntry === 'subscribers'}
							/>
							<Field.Label htmlFor='usersSubscribers'>{t('Mass_message_all_subscribers')}</Field.Label>
						</Field.Row>
					</Field>
					<Field width='unset'>
						<Field.Row>
							<RadioButton
								id='usersFollowers'
								name='usersEntry'
								value='followers'
								onChange={handleUsersEntryChange}
								checked={usersEntry === 'followers'}
							/>
							<Field.Label htmlFor='usersFollowers'>{t('Mass_message_all_followers')}</Field.Label>
						</Field.Row>
					</Field>
				</Box>

				{usersEntry === 'subscribers' && (
					<Box mbs='x16'>{t('Mass_message_subscribers_description')}</Box>
				)}

				{usersEntry === 'followers' && (
					<Box mbs='x16'>{t('Mass_message_followers_description')}</Box>
				)}

				{usersEntry === 'manual' && (
					<>
						<Box mbs='x16'>{t('Mass_message_manual_entry_description')}</Box>
						<Box mbs='x16' display='flex' flexDirection='column' width='full'>
							<UserAutoCompleteMultiple value={users} onChange={onChangeUsers} excludeself='true' />
						</Box>
					</>
				)}

			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={users.length < 1} onClick={onCreate} primary>
						{t('Create_Mass_Message')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(CreateMassMessage);
