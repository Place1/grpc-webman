import React, { SyntheticEvent } from 'react';
import { Heading, Pane, IconButton, TextInput, HeadingProps } from 'evergreen-ui';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { findDOMNode } from 'react-dom';
import { Text } from './text';

interface Props {
  size?: HeadingProps['size'];
  value: string;
  onChange: (value: string) => void;
}

@observer
export class EditableHeading extends React.Component<Props> {

  inputRef = React.createRef<TextInput>();

  @observable
  editing = false;

  onEdit = () => {
    this.editing = true;
    setTimeout(() => {
      if (this.inputRef.current) {
        const node = findDOMNode(this.inputRef.current) as HTMLInputElement;
        node.focus();
      }
    }, 0);
  }

  render() {
    return (
      <Pane display="flex" alignItems="center">
        {!this.editing &&
          <>
            <Heading size={this.props.size} minWidth={1}>
              <Text>{this.props.value}</Text>
            </Heading>
            <IconButton
              appearance="minimal"
              icon="edit"
              marginLeft={8}
              onClick={this.onEdit}
            />
          </>
        }

        {this.editing &&
          <TextInput
            ref={this.inputRef}
            value={this.props.value}
            onChange={(event: SyntheticEvent<HTMLInputElement>) => this.props.onChange(event.currentTarget.value)}
            onBlur={() => this.editing = false}
          />
        }
      </Pane>
    );
  }
}
