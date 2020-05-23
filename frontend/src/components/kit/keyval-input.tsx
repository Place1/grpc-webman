import * as React from 'react';
import { Pane, TextInput, IconButton } from 'evergreen-ui';
import { observable, computed } from 'mobx';
import { observer } from 'mobx-react';

interface Props {
  value?: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

@observer
export class KeyvalInput extends React.Component<Props> {

  @computed
  get pairs() {
    return Array.from(Object.entries(this.props.value || {}));
  }

  @observable
  key = "";

  @observable
  value = "";

  add = () => {
    this.props.onChange({
      ...this.props.value,
      '': '',
    });
  }

  set = (currentKey: string, key: string, value: string) => {
    const next: any = {
      ...this.props.value,
      [key]: value,
    };
    if (currentKey !== key) {
      delete next[currentKey];
    }
    this.props.onChange(next);
  }

  remove = (key: string) => {
    const next: any = {
      ...this.props.value,
    };
    delete next[key];
    this.props.onChange(next);
  }

  render() {
    return (
      <Pane display="flex" flexDirection="column">
        {this.pairs.map((p, i) => (
          <Pane key={i} display="flex" marginBottom={6}>
            <TextInput
              placeholder="key"
              value={p[0]}
              onChange={(event: React.SyntheticEvent<HTMLInputElement>) => this.set(p[0], event.currentTarget.value, p[1])}
            />
            <TextInput
              placeholder="value"
              marginLeft={12}
              value={p[1]}
              onChange={(event: React.SyntheticEvent<HTMLInputElement>) => this.set(p[0], p[0], event.currentTarget.value)}
            />
            <IconButton
              icon="minus"
              marginLeft={12}
              appearance="default"
              onClick={() => this.remove(p[0])}
            />
          </Pane>
        ))}
        <IconButton
          icon="plus"
          onClick={this.add}
        />
      </Pane>
    );
  }
}
