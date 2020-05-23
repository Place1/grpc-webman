import { FilePicker, FormField, IconButton, Pane, Tab, Tablist, Button, SideSheet, Heading, Table, Popover, Menu } from 'evergreen-ui';
import { computed, observable } from 'mobx';
import { observer } from 'mobx-react';
import React from 'react';
import { domain } from '../backend';
import { collections, workspaces } from '../storage/stores';
import { Workspace } from './workspace';
import { promisedComputed } from 'computed-async-mobx';
import { WorkspaceModel, FileModel } from '../storage/models';
import { EditableHeading } from './kit/editable-heading';
import { ErrorCallout } from './kit/error-callout';

interface Props {
  id: string;
}

@observer
export class Collection extends React.Component<Props> {

  @observable
  showFiles = false;

  @observable
  error?: Error;

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
    if (!this.collection.files || this.collection.files.length === 0) {
      return [];
    }
    try {
      return await domain.ListMethods(this.collection.files);
    }
    catch (error) {
      this.error = error;
      return [];
    }
  });

  onProtoFiles = async (files: File[]) => {
    const models = files.map(async (f): Promise<FileModel> => ({
      name: f.name,
      // @ts-ignore
      content: await f.text(),
    }));
    this.collection.files = [
      ...this.collection.files,
      ...await Promise.all(models),
    ];
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

  removeFile = (f: FileModel) => {
    this.collection.files = this.collection.files.filter(file => file !== f);
  }

  render() {
    return (
      <div>
        <Pane display="flex" alignItems="center" justifyContent="space-between" marginBottom={36}>
          <EditableHeading
            size={800}
            value={this.collection.name}
            onChange={value => this.collection.name = value}
          />

          {this.collection.files.length !== 0 &&
            <Pane background="tint1" padding={6}>
              <Button iconBefore="folder-open" appearance="minimal" onClick={() => this.showFiles = true}>
                Files
              </Button>
            </Pane>
          }
        </Pane>

        {this.error &&
          <ErrorCallout error={this.error} />
        }

        {this.collection.files.length === 0 &&
          <FormField label="Proto File(s)">
            <FilePicker width={350} multiple onChange={this.onProtoFiles} />
          </FormField>
        }

        <SideSheet
          isShown={this.showFiles}
          onCloseComplete={() => this.showFiles = false}
        >
          <Pane padding={16} borderBottom="muted">
            <Heading size={600}>Protobuf Files</Heading>
          </Pane>
          <Pane padding={16} borderBottom="muted">
            <FormField label="Add Proto File(s)">
              <FilePicker width={350} onChange={this.onProtoFiles} />
            </FormField>
          </Pane>
          <Pane padding={16}>
            {this.collection.files.map((f, i) => (
              <Table.Row key={i}>
                <Table.TextCell>{f.name}</Table.TextCell>
                <Table.Cell display="flex" justifyContent="flex-end">
                  <Popover
                    content={
                      <Menu>
                        <Menu.Group>
                          <Menu.Item intent="danger" onSelect={() => this.removeFile(f)}>Delete</Menu.Item>
                        </Menu.Group>
                      </Menu>
                    }
                  >
                    <IconButton icon="more" appearance="minimal" />
                  </Popover>
                </Table.Cell>
              </Table.Row>
            ))}
          </Pane>
        </SideSheet>

        {this.collection.files.length > 0 &&
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
