import { visit } from 'unist-util-visit';

const PANEL_NAMES = ['request', 'response'];
const DEFAULT_LABELS = ['Request', 'Response'];

const toClassName = (classNames) => classNames.filter(Boolean).join(' ');

const createPanel = (codeNode, index, label) => ({
	type: 'containerDirective',
	name: 'request-response-panel',
	data: {
		hName: 'section',
		hProperties: {
			className: toClassName(['request-response__panel', `request-response__panel--${PANEL_NAMES[index]}`]),
		},
	},
	children: [
		{
			type: 'paragraph',
			data: {
				hName: 'div',
				hProperties: {
					className: 'request-response__label',
				},
			},
			children: [
				{
					type: 'text',
					value: label,
				},
			],
		},
		codeNode,
	],
});

export function remarkRequestResponse() {
	return (tree, file) => {
		visit(tree, 'containerDirective', (node) => {
			if (node.name !== 'request-response') {
				return;
			}

			const codeNodes = node.children.filter((child) => child.type === 'code');

			if (codeNodes.length < 2) {
				file.message('request-response directive requires at least two code blocks.', node);
				return;
			}

			if (codeNodes.length > 2) {
				file.message('request-response directive only renders the first two code blocks.', node);
			}

			const requestLabel = node.attributes?.request ?? DEFAULT_LABELS[0];
			const responseLabel = node.attributes?.response ?? DEFAULT_LABELS[1];

			node.data = {
				hName: 'div',
				hProperties: {
					className: 'request-response',
				},
			};
			node.children = [
				createPanel(codeNodes[0], 0, requestLabel),
				createPanel(codeNodes[1], 1, responseLabel),
			];
		});
	};
}
