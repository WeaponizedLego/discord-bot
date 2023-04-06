import { SlashCommandBuilder } from 'discord.js'
import { joinVoiceChannel } from '@discordjs/voice'
import { openapi_token } from '../config.json'
import { Configuration, OpenAIApi } from 'openai'
import * as prism from 'prism-media'
import * as fs from 'fs'
import * as path from 'path'
import * as lamejs from 'lamejs'

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join-me')
    .setDescription('Joins the user to the voice channel, if they are in one.'),
  async execute(interaction: any) {
    await interaction.deferReply()

    const member = interaction.member
    // const voice = member.voice
    const voiceChannel = member.voice.channel

    // voiceChannel.disconnect('test')

    await member.fetch()
    // await voice.fetch()

    if (!voiceChannel) {
      await interaction.editReply("You're not in a voice channel!")
      return
    }

    const connection = await joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false
    })

    // set the speaker as the user who invited the bot
    const speaker = member.user.username

    await interaction.editReply(
      `Joined ${voiceChannel.name}, and listening to ${speaker}`
    )

    /**
     * Here we start listening to the user's voice, and create a stream of the audio.
     * We store the audio in small chunks worth of 5 seconds of audio. And then prepare
     * it to be sendt to OpenAI whisper API. for voice to text conversion.
     */

    let audioChunks: any[] = []
    const audioStream = connection.receiver.subscribe(member.user.id)

    audioStream.on('data', (chunk: any) => {
      console.log(`getting data, the array is now ${audioChunks.length} long`)

      const id =
        audioChunks.length > 0
          ? Math.max(...audioChunks.map((c) => c.id)) + 1
          : 0

      audioChunks.push({
        id,
        data: chunk
      })

      if (audioChunks.length === 5 * 50) {
        // Assuming 20ms per chunk (50 chunks per second)
        saveAudioChunksAsMP3(audioChunks).catch((err) => {
          console.error('Error saving audio chunks as MP3:', err)
        })
        audioChunks = []
      }
    })

    // every 5 seconds we take all the chunks and send it to OpenAI

    audioStream.on('end', async () => {
      const audio = Buffer.concat(audioChunks.map((c) => c.data))
      const decoder = new prism.opus.Decoder({
        rate: 48000,
        channels: 2,
        frameSize: 960
      })
      const pcm = decoder.write(audio)

      console.log(pcm)
    })
  }
}

async function convertBufferToMP3(
  inputBuffer: ArrayBuffer,
  sampleRate: number,
  numChannels: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const buffer = new Int16Array(inputBuffer)
    const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128) // 128kbps
    const mp3Data: Uint8Array[] = []

    const blockSize = 1152
    for (let i = 0; i < buffer.length; i += blockSize) {
      const buf = buffer.subarray(i, i + blockSize)
      const mp3buf = mp3encoder.encodeBuffer(buf)
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf)
      }
    }

    const endBuffer = mp3encoder.flush()
    if (endBuffer.length > 0) {
      mp3Data.push(endBuffer)
    }

    const blob = new Blob(mp3Data, { type: 'audio/mp3' })
    resolve(blob)
  })
}

async function saveAudioChunksAsMP3(
  audioChunks: { id: number; data: any }[]
): Promise<void> {
  const concatenatedBuffer = Buffer.concat(
    audioChunks.map((chunk) => Buffer.from(chunk.data))
  )
  const mp3Blob = await convertBufferToMP3(concatenatedBuffer.buffer, 48000, 2) // Assuming 48000 sample rate and 2 channels

  const timestamp = new Date().getTime()
  const outputFilePath = path.join(__dirname, 'audio/tmp', `${timestamp}.mp3`)

  const fileWriter = fs.createWriteStream(outputFilePath)
  const arrayBuffer = await mp3Blob.arrayBuffer()
  fileWriter.write(Buffer.from(arrayBuffer))
  fileWriter.end()

  fileWriter.on('finish', () => {
    console.log(`MP3 file saved: ${outputFilePath}`)
  })

  fileWriter.on('error', (err) => {
    console.error(`Error saving MP3 file: ${err}`)
  })
}
