import { SlashCommandBuilder } from 'discord.js'
import { openapi_token } from '../config.json'
import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
  apiKey: openapi_token
})
const openai = new OpenAIApi(configuration)

module.exports = {
  data: new SlashCommandBuilder()
    .setName('joinvoice')
    .setDescription('Join a voice channel to answer questions')
    .addStringOption((option) => {
      return option
        .setName('channel')
        .setDescription('The voice channel you want Jarvis to join')
        .setRequired(true)
    }),
  async execute(interaction: {
    deferReply: () => any
    options: { getString: (arg0: string) => any }
    client: { actions: { ThreadCreate: () => any } }
    editReply: (arg0: string) => any
  }) {
    await interaction.deferReply()

    const channelName = interaction.options.getString('channel')

    console.log(interaction.client.actions)
    await interaction.client.actions.ThreadCreate()

    await interaction.editReply('Joining voice channel: ' + channelName)

    // have the discord bot join the specified voice channel,
    // and start listening for questions. Store the audio stream in a variable so it can
    // be sent to the openai api whisper api

    // const connection = await interaction.member.voice.channel.join()

    // console.log('connection', connection)
    console.log(
      '_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ '
    )
  }
}
