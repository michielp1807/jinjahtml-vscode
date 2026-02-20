const vscode = require('vscode')
const TemplatePathProvider = require("./templatePathProvider").TemplatePathProvider

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  // This hack is necessary to ensure that the vscode.html-language-features extension is activated in order to enable
  // htmlLanguageParticipants support. Please see https://github.com/microsoft/vscode/issues/160585 for more info.
  const htmlExtension = vscode.extensions.getExtension('vscode.html-language-features')

  if (!htmlExtension) {
    const output = vscode.window.createOutputChannel('Jinja')

    output.appendLine(
      'Warning: Could not find vscode.html-language-features. HTML Language Participants support will be disabled.',
    )
    return
  }

  await htmlExtension?.activate()

  // Provide template path definitions for extends/include statements
  const definitions = new TemplatePathProvider()
  context.subscriptions.push(vscode.languages.registerDefinitionProvider([{ scheme: 'file' }], definitions))
}

module.exports = {
  activate,
}
