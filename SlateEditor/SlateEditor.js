import React, { Component } from 'react';
import { Editor } from 'slate-react';
import { renderMark, renderNode, onPaste } from './renderers';
import HoverMenu from './HoverMenu';
import { Value, Block } from 'slate';
import initialValue from './InitialValue';
import ControlMenu from './ControlMenu';
import Html from 'slate-html-serializer';
import rules from './rules';

const html = new Html({ rules });

const schema = {
    document: {
        last: { type: 'paragraph' },
        normalize: (editor, { code, node, child }) => {
            switch (code) {
                case 'last_child_type_invalid': {
                    const paragraph = Block.create('paragraph')
                    return editor.insertNodeByKey(node.key, node.nodes.size, paragraph)
                }
            }
        },
    },
    blocks: {
        image: {
            isVoid: true,
        },
    },
}

class SlateEditor extends Component {
    state = {
        value: Value.create(),
        isLoaded: false
    }

    componentDidMount() {
        const value = this.props.initialValue ? Value.fromJSON(html.deserialize(this.props.initialValue)) : Value.fromJSON(initialValue);

        this.updateMenu();
        this.setState({
            isLoaded: true,
            value
        });
    }

    componentDidUpdate = () => {
        this.updateMenu();
    }

    // On change, update the app's React state with the new editor value.
    onChange = ({ value }) => {
        this.setState({ value })
    }

    onKeyDown = (event, change, next) => {
        if (!this.props.isSaving && event.which === 83 && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            this.save();
            return;
        }

        next();
    }

    updateMenu = () => {
        const menu = this.menu
        if (!menu) return

        const { value } = this.state
        const { fragment, selection } = value

        if (selection.isBlurred || selection.isCollapsed || fragment.text === '') {
            menu.removeAttribute('style')
            return
        }

        const native = window.getSelection()
        const range = native.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        menu.style.opacity = 1
        menu.style.top = `${rect.top + window.pageYOffset - menu.offsetHeight}px`

        menu.style.left = `${rect.left +
            window.pageXOffset -
            menu.offsetWidth / 2 +
            rect.width / 2}px`
    }

    getTitle = () => {
        const { value } = this.state;
        const firstBlock = value.document.getBlocks().get(0);
        const secondBlock = value.document.getBlocks().get(1);

        const title = firstBlock && firstBlock.text ? firstBlock.text : 'No title';
        const subTitle = secondBlock && secondBlock.text ? secondBlock.text : 'No sub title';

        return {
            title,
            subTitle
        }
    }

    save = () => {
        const { value } = this.state;
        const headingValues = this.getTitle();

        const text = html.serialize(value);

        !this.props.isSaving && this.props.saveBlog(headingValues, text);
    }

    renderEditor = (props, editor, next) => {
        const children = next()
        return (
            <>
                <ControlMenu
                    isSaving={this.props.isSaving}
                    saveBlog={this.save} />
                {children}
                <HoverMenu innerRef={menu => (this.menu = menu)} editor={editor} />
            </>
        )
    }

    // Render the editor.
    render() {
        const { isLoaded } = this.state;

        return (
            <>
                {isLoaded ? <Editor
                    value={this.state.value}
                    schema={schema}
                    onChange={this.onChange}
                    onKeyDown={this.onKeyDown}
                    onPaste={onPaste}
                    renderEditor={this.renderEditor}
                    renderMark={renderMark}
                    renderNode={renderNode}
                />
                    : null}
            </>
        )
    }
}

export default SlateEditor;