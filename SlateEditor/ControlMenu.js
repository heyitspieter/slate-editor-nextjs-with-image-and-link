import React from 'react';

const ControlMenu = props => {

    return (
        <div className="control-menu">
            <div className="status-box">
                <span className="mr-2">{props.isSaving ? 'Saving...' : 'Saved'}</span>
                <button className="btn btn-success" disabled={props.isSaving} onClick={props.saveBlog}>
                    Save
                </button>
            </div>
        </div>
    );
}

export default ControlMenu;