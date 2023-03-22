import { SlashCommandBuilder } from 'discord.js'

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction: { reply: (arg0: string) => any }) {
    console.time('Ping finished with')
    await interaction.reply('Pong!')
    console.timeLog('Ping finished with', 'pong')
  }
}
