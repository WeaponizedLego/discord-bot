import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import ytdl from 'ytdl-core'
import { CustomClient, mongoClient, player } from '..'

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a song from youtube')
    .addStringOption((option) => {
      return option
        .setName('link')
        .setDescription('The youtube link to play')
        .setRequired(true)
    }),
  async execute(interaction: any) {
    await interaction.deferReply()

    // if (!interaction.member.voice.channel) {
    //   await interaction.editReply(
    //     'You must be in a voice channel to use this command'
    //   )
    //   return
    // }

    const channel = interaction.member.voice.channel
    const link = interaction.options.getString('link')
    console.log('youtube link: ', link)

    const isPlaylist = link.match(/\&list\=/) ? true : false

    console.log('isPlaylist: ', isPlaylist)

    const defaultPlaylist = {
      guildId: interaction.guild.id,
      songs: [],
      playing: false,
      volume: 100,
      loop: false,
      shuffle: false
    }

    const mongo = await mongoClient()

    const guildPlaylist = await mongo.db().collection('playlists').findOne({
      guildId: interaction.guild.id
    })

    if (!guildPlaylist) {
      await mongo.db().collection('playlists').insertOne(defaultPlaylist)
    }

    const playlist = !guildPlaylist ? defaultPlaylist : guildPlaylist

    try {
      const isPlayable =
        (await ytdl.validateURL(link)) && (await ytdl.getInfo(link))

      console.log('validated Url: ', await ytdl.validateURL(link))
      console.log('Info: ', await ytdl.getInfo(link))

      console.log('isPlayable: ', isPlayable)

      // initialize the player
      // @ts-ignore
      await player.play(channel, link, {
        nodeOptions: {
          metadata: interaction
        }
      })

      let embed = new EmbedBuilder()
    } catch (error) {
      console.log('error: ', error)
    }
  }
}
