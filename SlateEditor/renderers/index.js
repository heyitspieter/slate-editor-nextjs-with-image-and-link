import { Button, Icon } from '../components';
import { getEventTransfer } from 'slate-react';
import { css } from 'emotion';
import isUrl from 'is-url';

const DEFAULT_NODE = 'paragraph';

const hasBlock = (type, value) => {
    return value.blocks.some(node => node.type == type)
}

const hasLinks = (value) => {
    return value.inlines.some(inline => inline.type === 'link')
}

function onClickMark(event, type, editor) {
    event.preventDefault()
    editor.toggleMark(type)
}

function wrapLink(editor, href) {
    editor.wrapInline({
        type: 'link',
        data: { href },
    })

    editor.moveToEnd()
}

function unwrapLink(editor) {
    editor.unwrapInline('link')
}

function insertImage(editor, src, target) {
    if (target) {
        editor.select(target)
    }

    editor.insertBlock({
        type: 'image',
        data: { src },
    })
}

const onClickBlock = (event, type, editor) => {
    event.preventDefault()

    const { value } = editor
    const { document } = value

    // Handle everything but list buttons.
    if (type != 'bulleted-list' && type != 'numbered-list') {
        const isActive = hasBlock(type, value)
        const isList = hasBlock('list-item', value)

        if (isList) {
            editor
                .setBlocks(isActive ? DEFAULT_NODE : type)
                .unwrapBlock('bulleted-list')
                .unwrapBlock('numbered-list')
        } else {
            editor.setBlocks(isActive ? DEFAULT_NODE : type)
        }

    } else {
        // Handle the extra wrapping required for list buttons.
        const isList = hasBlock('list-item', value)
        const isType = value.blocks.some(block => {
            return !!document.getClosest(block.key, parent => parent.type == type)
        })

        if (isList && isType) {
            editor
                .setBlocks(DEFAULT_NODE)
                .unwrapBlock('bulleted-list')
                .unwrapBlock('numbered-list')
        } else if (isList) {
            editor
                .unwrapBlock(
                    type == 'bulleted-list' ? 'numbered-list' : 'bulleted-list'
                )
                .wrapBlock(type)
        } else {
            editor.setBlocks('list-item').wrapBlock(type)
        }
    }
}

const onClickLink = (event, editor) => {
    event.preventDefault()

    const { value } = editor
    const isLink = hasLinks(value)

    if (isLink) {
        editor.command(unwrapLink)
    } else if (value.selection.isExpanded) {
        const href = window.prompt('Enter the URL of the link:')

        if (href == null) {
            return
        }

        editor.command(wrapLink, href)
    } else {
        const href = window.prompt('Enter the URL of the link:')

        if (href == null) {
            return
        }

        const text = window.prompt('Enter the text for the link:')

        if (text == null) {
            return
        }

        editor
            .insertText(text)
            .moveFocusBackward(text.length)
            .command(wrapLink, href)
    }
}

const onClickImage = (event, editor) => {
    event.preventDefault()
    const src = window.prompt('Enter the URL of the image:')
    if (!src) return
    editor.command(insertImage, src)
}

export const onPaste = (event, editor, next) => {
    if (editor.value.selection.isCollapsed) return next()

    const transfer = getEventTransfer(event)
    const { value } = editor;
    const { type, text } = transfer
    if (type !== 'text' && type !== 'html') return next()
    if (!isUrl(text)) return next()

    if (hasLinks(value)) {
        editor.command(unwrapLink)
    }

    editor.command(wrapLink, text)
}

export function renderMarkButton(type, icon, editor) {
    const { value } = editor;
    const isActive = value.activeMarks.some(mark => mark.type == type)
    return (
        <Button
            reversed
            active={isActive}
            onMouseDown={event => onClickMark(event, type, editor)}
        >
            <Icon>{icon}</Icon>
        </Button>
    )
}

export const renderBlockButton = (type, icon, editor) => {
    const { value } = editor;
    let isActive = hasBlock(type, value)

    if (['numbered-list', 'bulleted-list'].includes(type)) {
        const { document, blocks } = value;

        if (blocks.size > 0) {
            const parent = document.getParent(blocks.first().key)
            isActive = hasBlock('list-item', value) && parent && parent.type === type
        }
    }

    return (
        <Button
            active={isActive}
            reversed
            onMouseDown={event => onClickBlock(event, type, editor)}>
            <Icon>{icon}</Icon>
        </Button>
    )
}

export const renderInlineButton = (type, icon, editor) => {
    const { value } = editor;
    const isActive = hasLinks(value)

    return (
        <Button
            active={isActive}
            reversed
            onMouseDown={event => onClickLink(event, editor)}
        >
            <Icon>{icon}</Icon>
        </Button>
    )
}

export const renderImageButton = (type, icon, editor) => {

    return (
        <Button onMouseDown={event => onClickImage(event, editor)}>
            <Icon>{icon}</Icon>
        </Button>
    )
}

export const renderMark = (props, editor, next) => {
    const { children, mark, attributes } = props

    switch (mark.type) {
        case 'bold':
            return <strong {...attributes}>{children}</strong>
        case 'code':
            return <code {...attributes}>{children}</code>
        case 'italic':
            return <em {...attributes}>{children}</em>
        case 'underlined':
            return <u {...attributes}>{children}</u>
        default:
            return next()
    }
}

export const renderNode = (props, editor, next) => {
    const { attributes, children, node, isFocused } = props

    switch (node.type) {
        case 'paragraph':
            return <p {...attributes}>{children}</p>
        case 'block-quote':
            return <blockquote {...attributes}>{children}</blockquote>
        case 'bulleted-list':
            return <ul {...attributes}>{children}</ul>
        case 'heading-one':
            return <h1 {...attributes}>{children}</h1>
        case 'heading-two':
            return <h2 {...attributes}>{children}</h2>
        case 'list-item':
            return <li {...attributes}>{children}</li>
        case 'numbered-list':
            return <ol {...attributes}>{children}</ol>
        case 'link':
            const { data } = node
            const href = data.get('href')
            return (
                <a {...attributes} href={href}>
                    {children}
                </a>
            )
        case 'image':
            const src = node.data.get('src')
            return (
                <img
                    {...attributes}
                    src={src}
                    className={css`
                      display: block;
                      max-width: 100%;
                      max-height: 20em;
                      box-shadow: ${isFocused ? '0 0 0 2px blue;' : 'none'};
                    `}/>
            )
        default:
            return next()
    }
}
