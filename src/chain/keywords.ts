import { Chain } from './chain'
import { Fragment } from './fragment'

export function DELETE_FROM (template: TemplateStringsArray, ...params: any[]): Chain {
  return new Chain([
    new Fragment(template, params, 'DELETE FROM ')
  ])
}

export function EXISTS (...params: any[]): Chain {
  if (params.length === 0) {
    return new Chain([
      new Fragment([''] as any, [], 'EXISTS (', ')')
    ])
  }

  return new Chain([
    new Fragment(['', ...new Array(params.length - 1).fill(', '), ''] as any, params, 'EXISTS (', ')')
  ])
}

export function INSERT_INTO (template: TemplateStringsArray, ...params: any[]): Chain {
  return new Chain([
    new Fragment(template, params, 'INSERT INTO ')
  ])
}

export function SELECT (template: TemplateStringsArray, ...params: any[]): Chain {
  return new Chain([
    new Fragment(template, params, 'SELECT ')
  ])
}

export function UPDATE (template: TemplateStringsArray, ...params: any[]): Chain {
  return new Chain([
    new Fragment(template, params, 'UPDATE ')
  ])
}

export function WITH_RECURSIVE (template: TemplateStringsArray, ...params: any[]): Chain {
  return new Chain([
    new Fragment(template, params, 'WITH_RECURSIVE ')
  ])
}
