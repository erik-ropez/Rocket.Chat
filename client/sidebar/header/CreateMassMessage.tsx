import { Box, Modal, ButtonGroup, Button, TextInput, Field, RadioButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FC, useState, memo, useCallback, ChangeEvent } from 'react';

import { IUser } from '../../../definition/IUser';
import UserAutoCompleteMultiple from '../../components/UserAutoCompleteMultiple';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointActionExperimental } from '../../hooks/useEndpointAction';
import { ChatSubscription } from '../../../app/models/client';
import { call, fireGlobalEvent } from '../../../app/ui-utils';
import { promises } from '../../../app/promises/client';
import axios from 'axios'

type Username = IUser['username'];

type CreateMassMessageProps = {
	onClose: () => void;
};

const CreateMassMessage: FC<CreateMassMessageProps> = ({ onClose }) => {
	const t = useTranslation();
	const [users, setUsers] = useState<Array<Username>>([]);
	const [text, setText] = useState('');
	const [usersEntry, setUsersEntry] = useState('manual');

	const createDirect = useEndpointActionExperimental('POST', 'dm.create');

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
			let msg = text.trim();

			for (let username of users) {
				const { room: { rid } } = await createDirect({ usernames: username });

				if (!ChatSubscription.findOne({ rid })) {
					await call('joinRoom', rid);
				}

				const tmid = undefined;
				const tshow = undefined;
	
				const message = await promises.run('onClientBeforeSendMessage', {
					_id: Random.id(),
					rid,
					tmid,
					tshow,
					msg,
				});
	
				try {
					await call('sendMessage', message);
				} catch (error) {
					console.log(error)
				}
			}

			onClose();
		} catch (error) {
			console.warn(error);
		}
	});

	const handleMessageChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setText(event.currentTarget.value);
	}, []);

	const subscribersEventListener = async (e) => {
		if (typeof e.data !== 'object' || typeof e.data.externalCommand !== 'string') {
			return;
		}

		if (e.data.externalCommand === 'init-rocket-effect') {
			window.removeEventListener('message', subscribersEventListener);

			const { data: { data: users } } = await axios.get(`${e.data.url}/api/customer/user/subscriber`, {
				headers: {
					'X-Authorization': `Bearer ${e.data.token}`
				}
			});

			setUsers(users.map(u => u.username));
		}
	};

	const handleUsersEntryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setUsers([])

		setUsersEntry(event.currentTarget.value);

		if (event.currentTarget.value == 'subscribers') {
			window.addEventListener('message', subscribersEventListener)
			fireGlobalEvent('init-rocket-effect');
		}
	}, []);

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Mass_Messages')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>

				<Box display='flex' flexDirection='row' width='full'>
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
					<Field width='unset'>
						<Field.Row>
							<RadioButton
								id='usersSubscribers'
								name='usersEntry'
								value='subscribers'
								onChange={handleUsersEntryChange}
								checked={usersEntry === 'subscribers'}
							/>
							<Field.Label htmlFor='usersSubscribers'>{t('Mass_message_subscribers')}</Field.Label>
						</Field.Row>
					</Field>
				</Box>

				{usersEntry === 'subscribers' && (
					<Box mbs='x16'>{t('Mass_message_subscribers_description')}</Box>
				)}

				{usersEntry === 'manual' && (
					<>
						<Box mbs='x16'>{t('Mass_message_manual_entry_description')}</Box>
						<Box mbs='x16' display='flex' flexDirection='column' width='full'>
							<UserAutoCompleteMultiple value={users} onChange={onChangeUsers} />
						</Box>
					</>
				)}

				<Box mbs='x16' display='flex' flexDirection='column' width='full'>
					<TextInput
						placeholder={t('Message')}
						onChange={handleMessageChange}
					/>
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={users.length < 1 || text.length <= 0} onClick={onCreate} primary>
						{t('Send')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(CreateMassMessage);
