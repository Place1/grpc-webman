import React from 'react';
import { Alert } from 'evergreen-ui';

interface Props {
  error: Error;
}

export class ErrorCallout extends React.Component<Props> {
  render() {
    return (
      <Alert
        intent="danger"
        title="Error"
      >
        <pre>{String(this.props.error).replace(/:\s/g, '\n→ ')}</pre>
      </Alert>
    )
  }
}
