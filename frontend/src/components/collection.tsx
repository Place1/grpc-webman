import { FilePicker, FormField, IconButton, Pane, Tab, Tablist } from 'evergreen-ui';
import { computed } from 'mobx';
import { observer } from 'mobx-react';
import React from 'react';
import { domain } from '../backend';
import { collections, workspaces } from '../storage/stores';
import { Workspace } from './workspace';
import { promisedComputed } from 'computed-async-mobx';
import { WorkspaceModel } from '../storage/models';
import { EditableHeading } from './kit/editable-heading';

interface Props {
  id: string;
}

@observer
export class Collection extends React.Component<Props> {

  @computed
  get collection() {
    return collections.get(this.props.id)!;
  }

  @computed
  get workspaces() {
    return workspaces.all().filter(w => w.collectionId === this.props.id);
  }

  @computed
  get selectedTabIndex() {
    if (this.collection.activeWorkspace) {
      return this.workspaces.findIndex(w => w.id === this.collection.activeWorkspace);
    }
    return 0;
  }

  @computed
  get selectedWorkspace() {
    return this.workspaces.find(w => w.id === this.collection.activeWorkspace)
  }

  methods = promisedComputed([], async () => {
    if (!this.collection.protofile) {
      return [];
    }
    return await domain.ListMethods(this.collection.protofile);
  });

  onProtoFiles = async (files: File[]) => {
    // @ts-ignore
    const protofile = await files[0].text();
    this.collection.protofile = protofile;
  }

  createTab = () => {
    const w = workspaces.create({
      name: 'Untitled',
      collectionId: this.props.id,
    });
    this.collection.activeWorkspace = w.id;
  }

  removeTab = (workspace: WorkspaceModel) => {
    workspaces.delete(workspace.id);
  }

  onTabMouseDown = (event: React.MouseEvent, workspace: WorkspaceModel) => {
    // on middle mouse button click remove the tab
    if (event.button === 1) {
      this.removeTab(workspace);
    }
  }

  render() {
    return (
      <div>
        <Pane marginBottom={36}>
          <EditableHeading
            size={800}
            value={this.collection.name}
            onChange={value => this.collection.name = value}
          />
        </Pane>

        {!this.collection.protofile &&
          <FormField label="Proto File(s)">
            <FilePicker width={350} onChange={this.onProtoFiles} />
          </FormField>
        }

        {this.collection.protofile &&
          <>
            <Pane display="flex" background="tint1" marginBottom={12}>
              <Tablist>
                {this.workspaces.map((tab, index) => (
                  <Tab
                    key={index}
                    height={36}
                    isSelected={this.selectedTabIndex === index}
                    onSelect={() => this.collection.activeWorkspace = tab.id}
                  >
                    <span style={{ marginRight: 2 }} onMouseDown={event => this.onTabMouseDown(event, tab)}>
                      {tab.name}
                    </span>
                    <IconButton
                      appearance="minimal"
                      icon="cross"
                      iconSize={10}
                      height={36}
                      marginRight={-8}
                      onClick={() => this.removeTab(tab)}
                    />
                  </Tab>
                ))}
              </Tablist>
              <IconButton appearance="minimal" icon="plus" height={36} onClick={this.createTab} />
            </Pane>

            <Pane flex="1">
              {this.workspaces.map((tab, index) => (
                <Pane
                  key={index}
                  display={this.selectedTabIndex === index ? 'block' : 'none'}
                >
                  <Workspace id={tab.id} collection={this.collection} methods={this.methods.get()} />
                </Pane>
              ))}
            </Pane>
          </>
        }
      </div>
    );
  }
}
