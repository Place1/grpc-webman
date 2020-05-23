import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

export function present(content: (close: Function) => React.ReactNode) {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const close = () => unmountComponentAtNode(root);
  render(<>{content(close)}</>, root);
}
