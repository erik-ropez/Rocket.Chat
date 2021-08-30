import { Meteor } from 'meteor/meteor';

import { AutoComplete, Box, Option, Chip } from '@rocket.chat/fuselage';
import { useMutableCallback, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { memo, useMemo, useState } from 'react';

import { useEndpointData } from '../../hooks/useEndpointData';
import UserAvatar from '../avatar/UserAvatar';
import Avatar from './Avatar';

const query = (term = '') => ({ selector: JSON.stringify({ term }) });

const UserAutoCompleteMultiple = (props) => {
	const excludeSelf = Boolean(props.excludeself || false);
	console.log('excludeSelf', excludeSelf);
	// delete props.excludeself;
	const selfUsername = Meteor.user().username;
	console.log('selfUsername', selfUsername);

	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const { value: data } = useEndpointData(
		'users.autocomplete',
		useMemo(() => query(debouncedFilter), [debouncedFilter]),
	);
	const options = useMemo(
		() => {
			console.log('data', data);
			if (data) {
				console.log('excludeSelf, selfUsername', [excludeSelf, selfUsername]);
				return data.items
					.filter((user) => !excludeSelf || (user.username != selfUsername))
					.map((user) => ({ value: user.username, label: user.name }))
			} else {
				return [];
			}
		},
		[data],
	);
	const onClickRemove = useMutableCallback((e) => {
		e.stopPropagation();
		e.preventDefault();
		props.onChange(e.currentTarget.value, 'remove');
	});

	return (
		<AutoComplete
			{...props}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ value: selected }) =>
				selected?.map((value) => (
					<Chip key={value} {...props} height='x20' value={value} onClick={onClickRemove} mie='x4'>
						<UserAvatar size='x20' username={value} />
						<Box is='span' margin='none' mis='x4'>
							{value}
						</Box>
					</Chip>
				))
			}
			renderItem={({ value, ...props }) => (
				<Option key={value} {...props} avatar={<Avatar value={value} />} />
			)}
			options={options}
		/>
	);
};

export default memo(UserAutoCompleteMultiple);
