import { Menu, Option, MenuProps, Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo, useContext, ReactNode, useRef, ComponentProps, FC } from 'react';
// import tinykeys from 'tinykeys';

// used to open the menu option by keyboard
import { IRoom } from '../../../../../definition/IRoom';
import Header from '../../../../components/Header';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { ToolboxActionConfig, OptionRenderer } from '../../lib/Toolbox';
import { ToolboxContext } from '../../lib/Toolbox/ToolboxContext';
import { useTab, useTabBarOpen } from '../../providers/ToolboxProvider';

const renderMenuOption: OptionRenderer = ({ label: { title, icon }, ...props }: any): ReactNode => (
	<Option label={title} icon={icon} {...props} />
);

type ToolBoxProps = {
	className?: ComponentProps<typeof Box>['className'];
	room?: IRoom;
};

const ToolBox: FC<ToolBoxProps> = ({ className }) => {
	const tab = useTab();
	const openTabBar = useTabBarOpen();
	const { isMobile } = useLayout();
	const t = useTranslation();
	const hiddenActionRenderers = useRef<{ [key: string]: OptionRenderer }>({});

	const { actions: mapActions } = useContext(ToolboxContext);
	const actions = (Array.from(mapActions.values()) as ToolboxActionConfig[]).sort(
		(a, b) => (a.order || 0) - (b.order || 0),
	);
	const visibleActions = isMobile ? [] : actions.slice(0, 3);

	const hiddenActions: MenuProps['options'] = Object.fromEntries(
		(isMobile ? actions : actions.slice(3)).map((item) => {
			hiddenActionRenderers.current = {
				...hiddenActionRenderers.current,
				[item.id]: item.renderOption || renderMenuOption,
			};
			return [
				item.id,
				{
					label: { title: t(item.title), icon: item.icon },
					action: (): void => {
						openTabBar(item.id);
					},
					...item,
				},
			] as any;
		}),
	);

	const actionDefault = useMutableCallback((e) => {
		const index = e.currentTarget.getAttribute('data-toolbox');
		openTabBar(actions[index].id);
	});

	// const open = useMutableCallback((index) => {
	// 	openTabBar(actions[index].id);
	// });

	// useEffect(() => {
	// 	if (!visibleActions.length) {
	// 		return;
	// 	}
	// 	const unsubscribe = tinykeys(window, Object.fromEntries(new Array(visibleActions.length).fill(true).map((_, index) => [`$mod+${ index + 1 }`, (): void => { open(index); }])));

	// 	return (): void => {
	// 		unsubscribe();
	// 	};
	// }, [visibleActions.length, open]);

	return (
		<>
			{visibleActions.map(({ renderAction, id, icon, title, action = actionDefault }, index) => {
				const props = {
					id,
					'title': t(title),
					className: className + ' tool-box-action',
					index,
					'info': id === tab?.id,
					'data-toolbox': index,
					action,
					'key': id,
				};
				if (renderAction) {
					props.icon = icon;
					return renderAction(props);
				}
				const iconHref = `#icon-${icon}`;
				return (
					<Header.ToolBoxAction {...props} >
						<svg class='rc-icon' aria-hidden='true'>
							<use href={iconHref}></use>
						</svg>
					</Header.ToolBoxAction>
				);
			})}
			{actions.length > 3 && (
				<Menu
					tiny={!isMobile}
					title={t('Options')}
					maxHeight='initial'
					className={className}
					aria-keyshortcuts='alt'
					tabIndex={-1}
					options={hiddenActions}
					renderItem={({ value, ...props }): ReactNode =>
						hiddenActionRenderers.current[value](props)
					}
				/>
			)}
		</>
	);
};

export default memo(ToolBox);
