import { Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, useEffect } from 'react';
import tinykeys from 'tinykeys';

import { useOutsideClick } from '../../../hooks/useOutsideClick';
import SearchList from '../../search/SearchList';

const Search = (props) => {
	const [searchOpen, setSearchOpen] = useState(false);

	// const viewRef = useRef();

	const handleCloseSearch = useMutableCallback(() => {
		setSearchOpen(false);
		// viewRef.current && Blaze.remove(viewRef.current);
	});

	const openSearch = useMutableCallback(() => {
		setSearchOpen(true);
	});

	const ref = useOutsideClick(handleCloseSearch);

	useEffect(() => {
		const unsubscribe = tinykeys(window, {
			'$mod+K': (event) => {
				event.preventDefault();
				openSearch();
			},
			'$mod+P': (event) => {
				event.preventDefault();
				openSearch();
			},
		});
		return () => {
			unsubscribe();
		};
	}, [openSearch]);

	return (
		<>
			<button type="button" onClick={openSearch} {...props}>
				<svg className="rc-icon" aria-hidden="true">
					<use href="#icon-magnifier"></use>
				</svg>
			</button>
			{searchOpen && <SearchList ref={ref} onClose={handleCloseSearch} />}
		</>
	);
};

export default Search;
