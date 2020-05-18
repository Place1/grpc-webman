import React from 'react';
import { observer } from "mobx-react";
import { computed } from "mobx";
import { app, collections } from "../storage/stores";
import { Pane } from "evergreen-ui";
import { Sidebar } from "./sidebar";
import { Collection } from "./collection";

@observer
export class App extends React.Component {

  @computed
  get activeCollection() {
    if (app.value.activeCollection) {
      return collections.get(app.value.activeCollection);
    }
    return undefined;
  }

  render() {
    return (
      <Pane display="flex" width="100vw" overflow="hidden">
        <Pane width={250} height="100vh" elevation={3}>
          <Sidebar />
        </Pane>
        <Pane padding={24} flex="1" overflow="hidden">
          {this.activeCollection &&
            <Collection id={this.activeCollection.id} />
          }
        </Pane>
      </Pane>
    )
  }
}
