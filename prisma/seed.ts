import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const users = [
  { name: "Wesley", balance: -118086.50 },
  { name: "_Ledger", balance: -97503.67 },
  { name: "Davin", balance: -71378.51 },
  { name: "APD", balance: -42916.14 },
  { name: "_EuroClubBanker", balance: -33579.04 },
  { name: "Stoicas", balance: -23115.69 },
  { name: "Musti", balance: -15834.77 },
  { name: "Yegor Staking", balance: -15711.48 },
  { name: "Don", balance: -14661.34 },
  { name: "Javier", balance: -10050.66 },
  { name: "_wpt", balance: -9956.21 },
  { name: "DKT", balance: -9787.12 },
  { name: "Josh S", balance: -8216.05 },
  { name: "Aztek", balance: -7976.67 },
  { name: "_OTC_opentrades", balance: -7863.97 },
  { name: "(PiA intern) Dan", balance: -6891.85 },
  { name: "Pieyre Agent", balance: -6782.55 },
  { name: "Manila Marc", balance: -6753.24 },
  { name: "Niki", balance: -5935.02 },
  { name: "Superman", balance: -5122.61 },
  { name: "Jonas", balance: -4810.60 },
  { name: "_coinpoker_tobi", balance: -3954.48 },
  { name: "Markus", balance: -3680.49 },
  { name: "Zacki", balance: -3329.85 },
  { name: "Simon Staking", balance: -3180.58 },
  { name: "Gabriel", balance: -3110.41 },
  { name: "_wpt Dan", balance: -3073.27 },
  { name: "Josh (Pinnacle)", balance: -3069.15 },
  { name: "Poker Hub", balance: -2824.23 },
  { name: "Nate Andrew", balance: -2751.88 },
  { name: "Sven&Dennis", balance: -2295.41 },
  { name: "Hirni", balance: -2008.31 },
  { name: "Alex max b", balance: -1979.91 },
  { name: "Martijn", balance: -1791.68 },
  { name: "Cos", balance: -1737.35 },
  { name: "Ray", balance: -1281.11 },
  { name: "Ivan", balance: -934.98 },
  { name: "Fireball Josh", balance: -926.18 },
  { name: "Rino M", balance: -502.01 },
  { name: "Amir", balance: -441.60 },
  { name: "Coinpoker", balance: -323.47 },
  { name: "CC", balance: -261.16 },
  { name: "Afimo", balance: -195.57 },
  { name: "NiklasAgent", balance: -181.96 },
  { name: "Matt", balance: -167.20 },
  { name: "cos ref", balance: 127.08 },
  { name: "Dawid", balance: 133.59 },
  { name: "Paulie", balance: 163.56 },
  { name: "Hayron Adrien", balance: 165.15 },
  { name: "(Pia intern) Haszel", balance: 197.69 },
  { name: "Nace", balance: 205.86 },
  { name: "_QQPK", balance: 217.33 },
  { name: "Alexandru", balance: 301.00 },
  { name: "Cam", balance: 391.49 },
  { name: "Felix Tobi Options", balance: 478.03 },
  { name: "Tor", balance: 493.90 },
  { name: "Demvoice", balance: 539.67 },
  { name: "DH", balance: 574.48 },
  { name: "_Staking fund", balance: 630.17 },
  { name: "Molly", balance: 648.08 },
  { name: "Binge", balance: 1064.37 },
  { name: "Gary", balance: 1089.43 },
  { name: "Felix", balance: 1116.00 },
  { name: "Anthony", balance: 1366.17 },
  { name: "Gypsiteam", balance: 1386.25 },
  { name: "Inactive Deposits", balance: 1538.35 },
  { name: "_zu klaeren", balance: 1604.32 },
  { name: "PrezTrump", balance: 1727.16 },
  { name: "Daniel H", balance: 2358.55 },
  { name: "Morten", balance: 2539.42 },
  { name: "felix ballerbude", balance: 2758.94 },
  { name: "Tua", balance: 3126.45 },
  { name: "Tim Stone", balance: 3313.15 },
  { name: "Konstantin", balance: 3508.65 },
  { name: "Alex G", balance: 3588.85 },
  { name: "Seb", balance: 3755.31 },
  { name: "Nick", balance: 3874.20 },
  { name: "_LuckyBun", balance: 4695.28 },
  { name: "Yegor", balance: 4735.16 },
  { name: "K345", balance: 4850.50 },
  { name: "Robert R", balance: 5854.53 },
  { name: "_Vigs", balance: 6059.18 },
  { name: "Julian", balance: 6591.82 },
  { name: "Red Rum", balance: 7243.44 },
  { name: "Jaque", balance: 7534.95 },
  { name: "_Limit Adjustment", balance: 9468.67 },
  { name: "Alex Po", balance: 9878.38 },
  { name: "Sprinkles", balance: 10006.42 },
  { name: "Andries", balance: 10671.95 },
  { name: "Didi", balance: 11173.46 },
  { name: "Hunter", balance: 14255.15 },
  { name: "rueckstellung musti", balance: 15107.44 },
  { name: "Freddy", balance: 18171.30 },
  { name: "(Pia intern) Johannes", balance: 18480.22 },
  { name: "Greenline", balance: 31253.55 },
  { name: "generelle rueckstellung", balance: 33051.45 },
  { name: "Viktor", balance: 33434.48 },
  { name: "Khoi", balance: 35686.84 },
  { name: "Nate Norman", balance: 38179.73 },
  { name: "Manuel wpt", balance: 39929.27 },
  { name: "Douglas", balance: 43525.64 },
  { name: "Tobi Poker Options", balance: 87007.00 },
]

async function main() {
  console.log("Seeding users and balances...")

  let created = 0
  let skipped = 0

  for (const u of users) {
    try {
      const user = await prisma.user.upsert({
        where: { email: `seed_${u.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}@poker.internal` },
        update: {},
        create: {
          name: u.name,
          email: `seed_${u.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}@poker.internal`,
          role: "USER",
        },
      })

      await prisma.balance.upsert({
        where: { userId: user.id },
        update: { amountUsd: u.balance },
        create: { userId: user.id, amountUsd: u.balance, amountEur: 0 },
      })

      created++
    } catch (e) {
      console.error(`Skipped ${u.name}:`, e)
      skipped++
    }
  }

  console.log(`Done! Created/updated: ${created}, Skipped: ${skipped}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())