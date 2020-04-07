import {
    Value
} from 'slate';

const initialValue = Value.fromJSON({
    document: {
        nodes: [{
            object: 'block',
            type: 'paragraph',
            nodes: [{
                object: 'text',
                leaves: [{
                    text: 'Write your story here...',

                }, ],
            }, ],
        }, ],
    },
});

export default initialValue;
