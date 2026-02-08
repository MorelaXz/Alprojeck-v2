import { createCanvas, loadImage } from "canvas"
import axios from "axios"

const toItalic = (str) => {
  const map = {
    'A':'𝐴','B':'𝐵','C':'𝐶','D':'𝐷','E':'𝐸','F':'𝐹','G':'𝐺','H':'𝐻','I':'𝐼','J':'𝐽',
    'K':'𝐾','L':'𝐿','M':'𝑀','N':'𝑁','O':'𝑂','P':'𝑃','Q':'𝑄','R':'𝑅','S':'𝑆','T':'𝑇',
    'U':'𝑈','V':'𝑉','W':'𝑊','X':'𝑋','Y':'𝑌','Z':'𝑍',
    'a':'𝑎','b':'𝑏','c':'𝑐','d':'𝑑','e':'𝑒','f':'𝑓','g':'𝑔','h':'ℎ','i':'𝑖','j':'𝑗',
    'k':'𝑘','l':'𝑙','m':'𝑚','n':'𝑛','o':'𝑜','p':'𝑝','q':'𝑞','r':'𝑟','s':'𝑠','t':'𝑡',
    'u':'𝑢','v':'𝑣','w':'𝑤','x':'𝑥','y':'𝑦','z':'𝑧',
    '0':'𝟎','1':'𝟏','2':'𝟐','3':'𝟑','4':'𝟒','5':'𝟓','6':'𝟔','7':'𝟕','8':'𝟖','9':'𝟗'
  }
  return str.split('').map(c => map[c] || c).join('')
}

const toItalicBold = (str) => {
  const map = {
    'A':'𝑨','B':'𝑩','C':'𝑪','D':'𝑫','E':'𝑬','F':'𝑭','G':'𝑮','H':'𝑯','I':'𝑰','J':'𝑱',
    'K':'𝑲','L':'𝑳','M':'𝑴','N':'𝑵','O':'𝑶','P':'𝑷','Q':'𝑸','R':'𝑹','S':'𝑺','T':'𝑻',
    'U':'𝑼','V':'𝑽','W':'𝑾','X':'𝒏','Y':'𝒀','Z':'𝒁',
    'a':'𝒂','b':'𝒃','c':'𝒄','d':'𝒅','e':'𝒆','f':'𝒇','g':'𝒈','h':'𝒉','i':'𝒊','j':'𝒋',
    'k':'𝒌','l':'𝒍','m':'𝒎','n':'𝒏','o':'𝒐','p':'𝒑','q':'𝒒','r':'𝒓','s':'𝒔','t':'𝒕',
    'u':'𝒖','v':'𝒗','w':'𝒘','x':'𝒙','y':'𝒚','z':'𝒛'
  }
  return str.split('').map(c => map[c] || c).join('')
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawGradientBg(ctx, width, height) {
  const grad = ctx.createLinearGradient(0, 0, width, height)
  grad.addColorStop(0, "#0f0c29")
  grad.addColorStop(0.5, "#302b63")
  grad.addColorStop(1, "#24243e")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)
}

export async function canvas(videos, query) {
  const W = 700
  const cardH = 150
  const pad = 18
  const gap = 14
  const headerH = 110
  const footerH = 46
  const thumbW = 170
  const thumbH = 96
  
  const totalH = headerH + pad + (videos.length * (cardH + gap)) - gap + pad + footerH
  const cvs = createCanvas(W, totalH)
  const ctx = cvs.getContext("2d")

  drawGradientBg(ctx, W, totalH)

  ctx.strokeStyle = "rgba(255,255,255,0.03)"
  ctx.lineWidth = 1
  for (let i = 0; i < W; i += 40) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, totalH); ctx.stroke()
  }
  for (let i = 0; i < totalH; i += 40) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke()
  }

  roundRect(ctx, pad, pad, W - pad * 2, headerH - pad, 16)
  ctx.fillStyle = "rgba(255,255,255,0.06)"
  ctx.fill()
  ctx.strokeStyle = "rgba(255,255,255,0.12)"
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = "#e94560"
  roundRect(ctx, pad, pad + 18, 5, headerH - pad - 36, 3)
  ctx.fill()

  ctx.fillStyle = "#ff0000"
  ctx.beginPath()
  ctx.arc(pad + 38, pad + 38, 24, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "#fff"
  ctx.beginPath()
  ctx.moveTo(pad + 30, pad + 24)
  ctx.lineTo(pad + 52, pad + 38)
  ctx.lineTo(pad + 30, pad + 52)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = "#ffffff"
  ctx.font = "bold italic 26px 'Arial'"
  ctx.fillText("YouTube Search", pad + 74, pad + 42)

  ctx.fillStyle = "#aaaacc"
  ctx.font = "italic 17px 'Arial'"
  ctx.fillText("Query: ", pad + 74, pad + 72)
  ctx.fillStyle = "#e94560"
  ctx.font = "bold italic 17px 'Arial'"
  ctx.fillText(query.length > 35 ? query.slice(0, 32) + "..." : query, pad + 74 + 55, pad + 72)

  let y = headerH + pad

  for (let i = 0; i < videos.length; i++) {
    const v = videos[i]
    const cx = pad
    const cy = y

    roundRect(ctx, cx, cy, W - pad * 2, cardH, 14)
    ctx.fillStyle = "rgba(255,255,255,0.055)"
    ctx.fill()
    ctx.strokeStyle = "rgba(255,255,255,0.1)"
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = i % 2 === 0 ? "#e94560" : "#9b59b6"
    roundRect(ctx, cx, cy + 20, 4, cardH - 40, 2)
    ctx.fill()

    const badgeGrad = ctx.createLinearGradient(cx + 18, cy, cx + 50, cy + 50)
    badgeGrad.addColorStop(0, "#e94560")
    badgeGrad.addColorStop(1, "#c0392b")
    ctx.fillStyle = badgeGrad
    ctx.beginPath()
    ctx.arc(cx + 34, cy + 34, 20, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = "#fff"
    ctx.font = "bold 16px 'Arial'"
    ctx.textAlign = "center"
    ctx.fillText((i + 1).toString(), cx + 34, cy + 40)
    ctx.textAlign = "left"

    const thumbX = cx + 64
    const thumbY = cy + (cardH - thumbH) / 2
    try {
      const thumbUrl = "https://i.ytimg.com/vi/" + v.videoId + "/sddefault.jpg"
      const img = await loadImage(thumbUrl)
      ctx.save()
      roundRect(ctx, thumbX, thumbY, thumbW, thumbH, 8)
      ctx.clip()
      ctx.drawImage(img, thumbX, thumbY, thumbW, thumbH)
      ctx.restore()

      ctx.fillStyle = "rgba(0,0,0,0.72)"
      roundRect(ctx, thumbX + thumbW - 52, thumbY + thumbH - 24, 48, 20, 4)
      ctx.fill()
      ctx.fillStyle = "#fff"
      ctx.font = "bold italic 13px 'Arial'"
      ctx.fillText(v.duration, thumbX + thumbW - 50, thumbY + thumbH - 9)
    } catch {
      roundRect(ctx, thumbX, thumbY, thumbW, thumbH, 8)
      ctx.fillStyle = "rgba(255,255,255,0.08)"
      ctx.fill()
      ctx.fillStyle = "#aaa"
      ctx.font = "italic 14px 'Arial'"
      ctx.textAlign = "center"
      ctx.fillText("No Thumb", thumbX + thumbW / 2, thumbY + thumbH / 2 + 5)
      ctx.textAlign = "left"
    }

    const txtX = cx + 64 + thumbW + 16
    const maxTxtW = W - pad * 2 - 64 - thumbW - 16 - 10

    const shortTitle = v.title.length > 32 ? v.title.slice(0, 29) + "..." : v.title
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold italic 17px 'Arial'"
    ctx.fillText(shortTitle, txtX, cy + 38)

    ctx.fillStyle = "#e94560"
    ctx.font = "italic 15px 'Arial'"
    ctx.fillText("👤 " + (v.channel.length > 22 ? v.channel.slice(0, 19) + "..." : v.channel), txtX, cy + 62)

    ctx.fillStyle = "#aaaacc"
    ctx.font = "italic 14px 'Arial'"
    ctx.fillText("⏱️  " + v.duration, txtX, cy + 84)

    const bY = cy + cardH - 34
    const vGrad = ctx.createLinearGradient(txtX, bY, txtX + 75, bY + 24)
    vGrad.addColorStop(0, "#e94560")
    vGrad.addColorStop(1, "#c0392b")
    ctx.fillStyle = vGrad
    roundRect(ctx, txtX, bY, 75, 24, 6)
    ctx.fill()
    ctx.fillStyle = "#fff"
    ctx.font = "bold italic 13px 'Arial'"
    ctx.fillText("📹 Video", txtX + 8, bY + 16)

    const aGrad = ctx.createLinearGradient(txtX + 83, bY, txtX + 158, bY + 24)
    aGrad.addColorStop(0, "#9b59b6")
    aGrad.addColorStop(1, "#6c3483")
    ctx.fillStyle = aGrad
    roundRect(ctx, txtX + 83, bY, 75, 24, 6)
    ctx.fill()
    ctx.fillStyle = "#fff"
    ctx.font = "bold italic 13px 'Arial'"
    ctx.fillText("🎧 Audio", txtX + 83 + 8, bY + 16)

    y += cardH + gap
  }

  const fY = y + pad
  roundRect(ctx, 0, fY, W, footerH, 0)
  ctx.fillStyle = "rgba(0,0,0,0.4)"
  ctx.fill()

  ctx.fillStyle = "#e94560"
  ctx.fillRect(0, fY, W, 2)

  ctx.fillStyle = "#aaaacc"
  ctx.font = "italic 15px 'Arial'"
  ctx.textAlign = "center"
  ctx.fillText("© Al Project — Powered by Baileys", W / 2, fY + 28)
  ctx.textAlign = "left"

  return cvs.toBuffer("image/png")
}
