/**
 * MKS Dark — custom shiki/TextMate theme for CLI diff previews.
 * Deep purple background with hot pink keywords, cyan types, green strings.
 * Based on the MKS2508 editor color scheme.
 */
export const mksDarkTheme = {
  name: 'mks-dark',
  displayName: 'MKS Dark',
  type: 'dark' as const,
  colors: {
    'editor.background': '#1e1e2e',
    'editor.foreground': '#d4d4d8',
    'editor.selectionBackground': '#3e3e5e',
    'editor.lineHighlightBackground': '#2a2a3c',
    'editorCursor.foreground': '#ff7edb',
    'editorWhitespace.foreground': '#3e3e5e',
  },
  tokenColors: [
    {
      name: 'Comments',
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#848bbd', fontStyle: 'italic' },
    },
    {
      name: 'JSDoc keywords',
      scope: [
        'comment.block.documentation storage.type',
        'comment.block.documentation punctuation.definition',
        'comment.block.documentation variable.other',
      ],
      settings: { foreground: '#9a9ece', fontStyle: 'italic' },
    },
    {
      name: 'Keywords',
      scope: [
        'keyword',
        'keyword.control',
        'keyword.operator.new',
        'keyword.operator.expression',
        'keyword.operator.typeof',
        'keyword.operator.of',
        'keyword.operator.in',
      ],
      settings: { foreground: '#ff7edb' },
    },
    {
      name: 'Storage / modifiers',
      scope: ['storage', 'storage.type', 'storage.modifier'],
      settings: { foreground: '#ff7edb' },
    },
    {
      name: 'Flow control (bold)',
      scope: ['keyword.control.flow', 'keyword.control.trycatch'],
      settings: { foreground: '#ff7edb', fontStyle: 'bold' },
    },
    {
      name: 'Import/Export',
      scope: [
        'keyword.control.import',
        'keyword.control.export',
        'keyword.control.from',
        'keyword.control.as',
        'keyword.control.default',
      ],
      settings: { foreground: '#ff7edb' },
    },
    {
      name: 'this/super',
      scope: ['variable.language.this', 'variable.language.super'],
      settings: { foreground: '#ff7edb', fontStyle: 'italic' },
    },
    {
      name: 'Function definitions',
      scope: ['entity.name.function', 'meta.function entity.name.function'],
      settings: { foreground: '#36f9f6' },
    },
    {
      name: 'Function calls',
      scope: ['entity.name.function.member', 'support.function'],
      settings: { foreground: '#82aaff' },
    },
    {
      name: 'Strings',
      scope: ['string', 'string.quoted', 'string.template'],
      settings: { foreground: '#addb67' },
    },
    {
      name: 'String interpolation',
      scope: ['punctuation.definition.template-expression', 'string.template punctuation'],
      settings: { foreground: '#ff7edb' },
    },
    {
      name: 'Numbers',
      scope: ['constant.numeric'],
      settings: { foreground: '#f78c6c' },
    },
    {
      name: 'Boolean / null / undefined',
      scope: [
        'constant.language.boolean',
        'constant.language.null',
        'constant.language.undefined',
      ],
      settings: { foreground: '#ff5572' },
    },
    {
      name: 'Constants',
      scope: ['variable.other.constant'],
      settings: { foreground: '#f78c6c' },
    },
    {
      name: 'Types / Interfaces / Classes',
      scope: [
        'entity.name.type',
        'entity.name.class',
        'support.type',
        'support.type.builtin',
        'support.type.primitive',
      ],
      settings: { foreground: '#36f9f6' },
    },
    {
      name: 'Type parameters (generics)',
      scope: ['entity.name.type.parameter', 'meta.type.parameters entity.name.type'],
      settings: { foreground: '#ffcb6b' },
    },
    {
      name: 'Type annotations',
      scope: ['meta.return.type', 'meta.type.annotation'],
      settings: { foreground: '#36f9f6' },
    },
    {
      name: 'Variables',
      scope: ['variable', 'variable.other.readwrite'],
      settings: { foreground: '#d4d4d8' },
    },
    {
      name: 'Parameters',
      scope: ['variable.parameter'],
      settings: { foreground: '#ffcb6b', fontStyle: 'italic' },
    },
    {
      name: 'Object properties',
      scope: [
        'variable.other.property',
        'variable.other.object.property',
        'meta.object-literal.key',
      ],
      settings: { foreground: '#c3cee3' },
    },
    {
      name: 'Operators',
      scope: [
        'keyword.operator',
        'keyword.operator.assignment',
        'keyword.operator.comparison',
        'keyword.operator.arithmetic',
        'keyword.operator.logical',
        'keyword.operator.ternary',
        'keyword.operator.spread',
        'keyword.operator.rest',
        'keyword.operator.optional',
      ],
      settings: { foreground: '#eeeeee' },
    },
    {
      name: 'Arrow function',
      scope: ['keyword.operator.arrow', 'storage.type.function.arrow'],
      settings: { foreground: '#ff7edb' },
    },
    {
      name: 'Braces { }',
      scope: ['punctuation.definition.block', 'meta.brace.curly', 'punctuation.section.braces'],
      settings: { foreground: '#fede5d' },
    },
    {
      name: 'Parens ( )',
      scope: [
        'meta.brace.round',
        'punctuation.definition.parameters',
        'punctuation.section.parens',
      ],
      settings: { foreground: '#d4d4d8' },
    },
    {
      name: 'Brackets [ ]',
      scope: [
        'meta.brace.square',
        'punctuation.definition.bracket',
        'punctuation.section.brackets',
      ],
      settings: { foreground: '#d4d4d8' },
    },
    {
      name: 'Semicolons / Commas',
      scope: [
        'punctuation.separator',
        'punctuation.terminator',
        'punctuation.separator.comma',
        'punctuation.terminator.statement',
      ],
      settings: { foreground: '#bbbbbb' },
    },
    {
      name: 'JSX/HTML Tags',
      scope: ['entity.name.tag', 'punctuation.definition.tag'],
      settings: { foreground: '#72f1b8' },
    },
    {
      name: 'JSX Components (PascalCase)',
      scope: ['support.class.component'],
      settings: { foreground: '#ff5572' },
    },
    {
      name: 'JSX/HTML Attributes',
      scope: ['entity.other.attribute-name'],
      settings: { foreground: '#fede5d', fontStyle: 'italic' },
    },
    {
      name: 'JSX expression braces',
      scope: ['punctuation.section.embedded'],
      settings: { foreground: '#ff7edb' },
    },
    {
      name: 'Decorators',
      scope: ['meta.decorator', 'punctuation.decorator'],
      settings: { foreground: '#ff7edb', fontStyle: 'italic' },
    },
    {
      name: 'Regex',
      scope: ['string.regexp'],
      settings: { foreground: '#f78c6c' },
    },
    {
      name: 'Escape characters',
      scope: ['constant.character.escape'],
      settings: { foreground: '#72f1b8' },
    },
    {
      name: 'CSS Property names',
      scope: ['support.type.property-name.css', 'meta.property-name.css'],
      settings: { foreground: '#ff7edb' },
    },
    {
      name: 'CSS Selectors',
      scope: [
        'entity.other.attribute-name.class.css',
        'entity.other.attribute-name.id.css',
        'entity.name.tag.css',
      ],
      settings: { foreground: '#fede5d' },
    },
    {
      name: 'CSS Variables',
      scope: ['variable.css', 'variable.argument.css', 'support.type.custom-property.css'],
      settings: { foreground: '#ff7edb' },
    },
    {
      name: 'CSS Functions',
      scope: ['support.function.css', 'support.function.misc.css'],
      settings: { foreground: '#36f9f6' },
    },
    {
      name: 'CSS Units',
      scope: ['keyword.other.unit.css'],
      settings: { foreground: '#f78c6c' },
    },
    {
      name: 'CSS Pseudo selectors',
      scope: [
        'entity.other.attribute-name.pseudo-class.css',
        'entity.other.attribute-name.pseudo-element.css',
      ],
      settings: { foreground: '#36f9f6' },
    },
    {
      name: 'JSON Keys',
      scope: ['support.type.property-name.json'],
      settings: { foreground: '#72f1b8' },
    },
    {
      name: 'JSON String values',
      scope: ['string.quoted.double.json'],
      settings: { foreground: '#addb67' },
    },
    {
      name: 'Markdown headings',
      scope: [
        'heading.1.markdown entity.name',
        'heading.2.markdown entity.name',
        'heading.3.markdown entity.name',
        'markup.heading',
      ],
      settings: { foreground: '#ff7edb', fontStyle: 'bold' },
    },
    {
      name: 'Markdown bold',
      scope: ['markup.bold'],
      settings: { foreground: '#ffcb6b', fontStyle: 'bold' },
    },
    {
      name: 'Markdown italic',
      scope: ['markup.italic'],
      settings: { foreground: '#ff7edb', fontStyle: 'italic' },
    },
    {
      name: 'Markdown links',
      scope: ['markup.underline.link'],
      settings: { foreground: '#82aaff' },
    },
    {
      name: 'Markdown code',
      scope: ['markup.inline.raw', 'markup.fenced_code'],
      settings: { foreground: '#addb67' },
    },
  ],
} as const;
