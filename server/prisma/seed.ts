import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient, PostType } from '@prisma/client'
import bcrypt from 'bcryptjs'

function getAdapter() {
  const url = new URL(process.env.DATABASE_URL!)
  return new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
  })
}

const prisma = new PrismaClient({ adapter: getAdapter() })

async function main() {
  console.log('Seeding DMG database...')

  // ---- Clean existing data (simple approach: delete in FK-safe order) ----
  console.log('Clearing existing data...')
  await prisma.projectImage.deleteMany()
  await prisma.projectService.deleteMany()
  await prisma.project.deleteMany()
  await prisma.brandingImage.deleteMany()
  await prisma.branding.deleteMany()
  await prisma.postImage.deleteMany()
  await prisma.post.deleteMany()
  await prisma.inquiry.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()
  await prisma.testimonial.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.client.deleteMany()
  await prisma.industry.deleteMany()
  await prisma.service.deleteMany()

  // ---- Team roles ----
  const roleData = [
    { name: 'CEO', description: 'Chief executive officer' },
    { name: 'Manager', description: 'Team manager' },
    { name: 'Sales Assistant', description: 'Sales support' },
    { name: 'Graphic Designer', description: 'Creative design' },
  ]
  const roles: Record<string, number> = {}
  for (const r of roleData) {
    const role = await prisma.role.create({ data: r })
    roles[r.name] = role.id
  }
  console.log(`Created ${roleData.length} roles`)

  // ---- User (admin) ----
  const admin = await prisma.user.create({
    data: {
      name: 'DMG Admin',
      email: 'admin@dmg.agency',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'admin',
    },
  })
  console.log(`Created admin user: ${admin.email}`)

  // ---- Services ----
  const serviceData = [
    { name: 'social-media', title: 'Social Media Marketing', description: 'Marketing across social platforms.', icon: 'social' },
    { name: 'video-production', title: 'Video Production', description: 'Content creation and video campaigns.', icon: 'video' },
    { name: 'content-marketing', title: 'Content Marketing', description: 'Blog, copy, and content strategy.', icon: 'content' },
    { name: 'media-buying', title: 'Media Buying', description: 'Paid ads planning and management.', icon: 'media_buying' },
    { name: 'strategy', title: 'Strategy', description: 'Brand and marketing strategy.', icon: 'strategy' },
  ]
  const services: Array<{ id: number; slug: string }> = []
  for (let i = 0; i < serviceData.length; i++) {
    const entry = serviceData[i]
    const service = await prisma.service.create({
      data: {
        name: entry.title,
        slug: entry.name,
        title: entry.title,
        description: entry.description,
        icon: entry.icon,
        sortOrder: i,
      },
    })
    services.push({ id: service.id, slug: service.slug })
  }
  console.log(`Created ${services.length} services`)

  // ---- Industries ----
  const industryData = [
    { name: 'Real Estate', slug: 'real-estate', description: 'Property development and sales' },
    { name: 'FMCG', slug: 'fmcg', description: 'Fast-moving consumer goods' },
    { name: 'Finance', slug: 'finance', description: 'Banking, fintech, and insurance' },
    { name: 'Hospitality', slug: 'hospitality', description: 'Hotels, restaurants, tourism' },
  ]
  const industries: Array<{ id: number; name: string }> = []
  for (const ind of industryData) {
    const industry = await prisma.industry.create({ data: ind })
    industries.push({ id: industry.id, name: industry.name })
  }
  console.log(`Created ${industries.length} industries`)

  // ---- Clients ----
  const clientData = [
    {
      name: 'Harbor Realty',
      description: 'Premium property developer.',
      industry: 'Real Estate',
    },
    {
      name: 'FreshCart',
      description: 'Everyday consumer goods brand.',
      industry: 'FMCG',
    },
    {
      name: 'NorthCap Finance',
      description: 'Digital-first lending platform.',
      industry: 'Finance',
    },
  ]
  const clientIds: Record<string, number> = {}
  for (let i = 0; i < clientData.length; i++) {
    const c = clientData[i]
    const industry = industries.find((ind) => ind.name === c.industry)
    const client = await prisma.client.create({
      data: {
        name: c.name,
        slug: c.name.toLowerCase().replace(/\s+/g, '-'),
        description: c.description,
        industryId: industry?.id ?? null,
      },
    })
    clientIds[c.name] = client.id
  }
  console.log(`Created ${clientData.length} clients`)

  // ---- Projects ----
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        clientId: clientIds['Harbor Realty'],
        title: 'Harbor Realty Launch Campaign',
        slug: 'harbor-realty-launch',
        summary: 'Full-funnel launch for new developments.',
        description: 'Multi-channel launch across social and media buying.',
        year: 2025,
        isPublished: true,
      },
    }),
    prisma.project.create({
      data: {
        clientId: clientIds['FreshCart'],
        title: 'FreshCart FMCG Rebrand',
        slug: 'freshcart-rebrand',
        summary: 'Brand refresh and content programme.',
        description: 'Rebranding plus ongoing content marketing.',
        year: 2024,
        isPublished: true,
      },
    }),
    prisma.project.create({
      data: {
        clientId: clientIds['NorthCap Finance'],
        title: 'NorthCap Digital Acquisition',
        slug: 'northcap-digital-acquisition',
        summary: 'Performance marketing for a fintech.',
        description: 'PPC and social paid acquisition.',
        year: 2025,
        isPublished: true,
      },
    }),
  ])
  console.log(`Created ${projects.length} projects`)

  // Link projects to services (explicit join rows)
  const projectServiceLinks = [
    { project: 'harbor-realty-launch', services: ['social-media', 'media-buying'] },
    { project: 'freshcart-rebrand', services: ['content-marketing'] },
    { project: 'northcap-digital-acquisition', services: ['media-buying', 'strategy'] },
  ]
  for (const link of projectServiceLinks) {
    const project = projects.find((p) => p.slug === link.project)!
    for (const slug of link.services) {
      const service = services.find((s) => s.slug === slug)!
      await prisma.projectService.create({
        data: { projectId: project.id, serviceId: service.id },
      })
    }
  }
  console.log('Linked projects to services')

  // ---- Brandings ----
  const brandings = await Promise.all([
    prisma.branding.create({
      data: {
        clientId: clientIds['FreshCart'],
        name: 'FreshCart Identity',
        slug: 'freshcart-identity',
        description: 'Logo, colors, and stationery.',
        primaryColor: '#e86a2a',
        secondaryColor: '#1f3a2e',
        accentColor: '#f4c430',
        isPublished: true,
      },
    }),
    prisma.branding.create({
      data: {
        clientId: clientIds['NorthCap Finance'],
        name: 'NorthCap Look',
        slug: 'northcap-look',
        description: 'Modern fintech visual identity.',
        primaryColor: '#0b6ee0',
        secondaryColor: '#12213a',
        accentColor: '#11c2b9',
        isPublished: true,
      },
    }),
  ])
  console.log(`Created ${brandings.length} brandings`)

  // ---- Posts ----
  await prisma.post.create({
    data: {
      type: PostType.blog,
      title: 'Why Performance Marketing Wins in 2025',
      slug: 'why-performance-marketing-wins-2025',
      excerpt: 'A short look at the channel mix that works today.',
      content:
        'Agencies that blend owned, earned, and paid channels consistently outperform those that rely on a single source. This post breaks down how to balance a modern funnel.',
      publishedAt: new Date(),
      isPublished: true,
    },
  })
  await prisma.post.create({
    data: {
      type: PostType.vlog,
      title: 'Behind the Scenes of a Rebrand',
      slug: 'behind-the-scenes-rebrand',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      youtubeId: 'dQw4w9WgXcQ',
      publishedAt: new Date(),
      isPublished: true,
    },
  })
  console.log('Created 2 posts')

  // ---- Team ----
  const teamData = [
    { name: 'Anna Miller', roleName: 'CEO' },
    { name: 'Ben Carter', roleName: 'Graphic Designer' },
    { name: 'Carla Rossi', roleName: 'Sales Assistant' },
    { name: 'David Kim', roleName: 'Manager' },
  ]
  for (let i = 0; i < teamData.length; i++) {
    const t = teamData[i]
    const roleId = roles[t.roleName]
    if (!roleId) throw new Error(`Role '${t.roleName}' not found. Check seed order.`)
    await prisma.teamMember.create({ data: { name: t.name, roleId, sortOrder: i } })
  }
  console.log('Created 4 team members')

  // ---- Testimonials ----
  await Promise.all([
    prisma.testimonial.create({
      data: {
        author: 'Laura Grant',
        role: 'Marketing Director',
        company: 'Harbor Realty',
        content: 'The launch exceeded every target we set. Clear process, great results.',
        rating: 5,
      },
    }),
    prisma.testimonial.create({
      data: {
        author: 'Tom Ellis',
        role: 'CEO',
        company: 'FreshCart',
        content: 'Transformed our brand and our metrics. Highly recommended.',
        rating: 5,
      },
    }),
    prisma.testimonial.create({
      data: {
        author: 'Priya Shah',
        role: 'Growth Lead',
        company: 'NorthCap Finance',
        content: 'Efficient, data-driven, and easy to work with.',
        rating: 4,
      },
    }),
  ])
  console.log('Created 3 testimonials')

  // ---- Inquiries (a couple of seeded leads) ----
  await prisma.inquiry.create({
    data: {
      name: 'Example Lead',
      email: 'lead@example.com',
      phone: '+1000000000',
      service: 'Strategy',
      message: 'We are looking for help with our strategy this year.',
      status: 'new',
    },
  })
  await prisma.inquiry.create({
    data: {
      name: 'Another Lead',
      email: 'another@example.com',
      service: 'Video Production',
      message: 'Would like a quote for a launch video.',
      status: 'contacted',
      handledById: admin.id,
    },
  })
  console.log('Created 2 inquiries')

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })