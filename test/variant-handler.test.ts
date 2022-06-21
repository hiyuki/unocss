import { createGenerator } from '@unocss/core'
import { describe, expect, test } from 'vitest'
import { variantMatcher } from '@unocss/preset-mini/utils'

describe('variants', () => {
  test('variant context is propagated', async () => {
    const uno = createGenerator({
      rules: [
        ['foo', { name: 'bar' }],
      ],
      variants: [
        {
          match(input) {
            const match = input.match(/^var:/)
            if (match) {
              return {
                matcher: input.slice(match[0].length),
                handle: (input, next) => next({
                  prefix: ':prefix > ',
                  selector: '.selector',
                  pseudo: '::pseudo',
                  entries: input.entries.map((entry) => {
                    entry[1] += ' !important'
                    return entry
                  }),
                  parent: '@supports',
                  layer: 'variant',
                }),
              }
            }
          },
        },
      ],
    })

    const { css } = await uno.generate([
      'foo',
      'var:foo',
    ].join(' '), { preflights: false })

    expect(css).toMatchSnapshot()
  })

  test('selector section is merged in order', async () => {
    const uno = createGenerator({
      rules: [
        ['foo', { name: 'bar' }],
      ],
      variants: [
        variantMatcher('pre', () => ({ prefix: '.prefix ' })),
        variantMatcher('main', () => ({ selector: '.replaced' })),
        variantMatcher('back', () => ({ pseudo: '::pseudo' })),
      ],
    })

    const { css } = await uno.generate([
      'pre:main:foo',
      'pre:back:foo',
      'main:back:foo',
      'pre:main:back:foo',
      'back:main:pre:foo',
    ].join(' '), { preflights: false })

    expect(css).toMatchSnapshot()
  })

  test('variant can stack', async () => {
    const uno = createGenerator({
      rules: [
        ['foo', { name: 'bar' }],
      ],
      variants: [
        {
          multiPass: true,
          match(input) {
            const match = input.match(/^(first|second|third):/)
            if (match) {
              return {
                matcher: input.slice(match[0].length),
                handle: (input, next) => next({
                  ...input,
                  selector: `${input.selector} > :${match[1]}`,
                }),
              }
            }
          },
        },
        {
          multiPass: true,
          match(input) {
            const match = input.match(/^(one|two|three):/)
            if (match) {
              return {
                matcher: input.slice(match[0].length),
                handle: (input, next) => {
                  const result = next(input)
                  return {
                    ...result,
                    selector: `${result.selector} + :${match[1]}`,
                  }
                },
              }
            }
          },
        },
      ],
    })

    const { css } = await uno.generate([
      'first:second:third:foo',
      'one:two:three:foo',
      'first:three:two:foo',
    ].join(' '), { preflights: false })

    expect(css).toMatchSnapshot()
  })
})
