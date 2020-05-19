import './index.css';
import 'core-js/stable';
import React from 'react';
import ReactDOM from 'react-dom';
import * as Wails from '@wailsapp/runtime';
import { Alert } from 'evergreen-ui';
import { observer } from 'mobx-react';
import { fromPromise } from 'mobx-utils';
import { Spring } from 'react-spring/renderprops';
import { Backend, setBackend } from './backend';
import { App } from './components/app';
import { app, collections, workspaces } from './storage/stores';

@observer
class Root extends React.Component {

  ready = fromPromise(Promise.all([
    app.load(),
    collections.load(),
    workspaces.load(),
  ]));

  // TODO: error boundary to catch local data corruption

  render() {
    return this.ready.case({
      pending: (staleValue) => {
        return <div></div>;
      },
      rejected: (error) => {
        return <Alert intent="danger" title="Big oops">{String(error)}</Alert>;
      },
      fulfilled: (value) => {
        return (
          <Spring from={{ opacity: 0 }} to={{ opacity: 1 }} config={{ tension: 280, friction: 26 }}>
            {props => (
              <div style={props}>
                <App />
              </div>
            )}
          </Spring>
        );
      },
    });
  }
}

declare global {
  const backend: Backend;
}

Wails.Init(() => {
  setBackend(backend);
  ReactDOM.render(<Root />, document.getElementById('app'));
});
