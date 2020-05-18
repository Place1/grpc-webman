import React from 'react';

export class Text extends React.Component {
  render() {
    return (
      <span style={{
        display: 'block',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
      }}>
        {this.props.children}
      </span>
    );
  }
}
