import { Sidebar } from '@rocket.chat/fuselage';
import React from 'react';

import { popover } from '../../../../app/ui-utils/client';

const config = (e) => ({
	template: 'SortList',
	currentTarget: e.currentTarget,
	data: {
		options: [],
	},
	offsetVertical: e.currentTarget.clientHeight + 10,
});

const onClick = (e) => {
	popover.open(config(e));
};

const Sort = (props) => (
	<button type="button" onClick={onClick} {...props}>
		<svg className="rc-icon" aria-hidden="true">
			<use href="#icon-sort"></use>
		</svg>
	</button>
);

export default Sort;
