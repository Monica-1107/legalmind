const Case = require("../models/Case.model")
const ErrorResponse = require("../utils/errorResponse")
const redis = require("../config/redis")

// @desc    Search laws
// @route   GET /api/search/laws
// @access  Public
exports.searchLaws = async (req, res, next) => {
  try {
    const { query, page = 1, limit = 10 } = req.query

    if (!query) {
      return next(new ErrorResponse("Please provide a search query", 400))
    }

    // Check if result is cached in Redis
    const cacheKey = `search:laws:${query}:${page}:${limit}`
    const cachedResult = await redis.get(cacheKey)

    if (cachedResult) {
      return res.status(200).json(JSON.parse(cachedResult))
    }

    // Simulate law search from a legal database
    // In a real application, this would query an actual legal database
    const startIndex = (page - 1) * limit

    // Simulated search results
    const mockLawsDatabase = [
      {
        id: "ipc-420",
        title: "Section 420 of IPC",
        description: "Cheating and dishonestly inducing delivery of property",
        category: "Criminal",
        content:
          "Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security, or anything which is signed or sealed, and which is capable of being converted into a valuable security, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.",
        tags: ["Criminal", "Fraud", "Property"],
      },
      {
        id: "constitution-21",
        title: "Article 21 of Constitution",
        description: "Protection of life and personal liberty",
        category: "Constitutional",
        content:
          "No person shall be deprived of his life or personal liberty except according to procedure established by law.",
        tags: ["Constitutional", "Rights", "Liberty"],
      },
      {
        id: "ipc-375",
        title: "Section 375 of IPC",
        description: "Definition of rape",
        category: "Criminal",
        content:
          'A man is said to commit "rape" if he— (a) penetrates his penis, to any extent, into the vagina, mouth, urethra or anus of a woman or makes her to do so with him or any other person; or (b) inserts, to any extent, any object or a part of the body, not being the penis, into the vagina, the urethra or anus of a woman or makes her to do so with him or any other person; or (c) manipulates any part of the body of a woman so as to cause penetration into the vagina, urethra, anus or any part of body of such woman or makes her to do so with him or any other person; or (d) applies his mouth to the vagina, anus, urethra of a woman or makes her to do so with him or any other person, under the circumstances falling under any of the following seven descriptions...',
        tags: ["Criminal", "Sexual Offense"],
      },
      {
        id: "contract-act-10",
        title: "Section 10 of Contract Act",
        description: "What agreements are contracts",
        category: "Civil",
        content:
          "All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not hereby expressly declared to be void.",
        tags: ["Civil", "Contract", "Agreement"],
      },
      {
        id: "crpc-154",
        title: "Section 154 of CrPC",
        description: "Information in cognizable cases",
        category: "Criminal Procedure",
        content:
          "Every information relating to the commission of a cognizable offence, if given orally to an officer in charge of a police station, shall be reduced to writing by him or under his direction, and be read over to the informant; and every such information, whether given in writing or reduced to writing as aforesaid, shall be signed by the person giving it, and the substance thereof shall be entered in a book to be kept by such officer in such form as the State Government may prescribe in this behalf.",
        tags: ["Criminal Procedure", "FIR", "Police"],
      },
    ]

    // Filter laws based on search query
    const filteredLaws = mockLawsDatabase.filter(
      (law) =>
        law.title.toLowerCase().includes(query.toLowerCase()) ||
        law.description.toLowerCase().includes(query.toLowerCase()) ||
        law.content.toLowerCase().includes(query.toLowerCase()) ||
        law.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())),
    )

    // Paginate results
    const paginatedLaws = filteredLaws.slice(startIndex, startIndex + Number.parseInt(limit))

    const result = {
      success: true,
      count: filteredLaws.length,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        totalPages: Math.ceil(filteredLaws.length / limit),
      },
      data: paginatedLaws,
    }

    // Cache the result in Redis for 1 hour
    await redis.set(cacheKey, JSON.stringify(result), "EX", 3600)

    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

// @desc    Search cases
// @route   GET /api/search/cases
// @access  Private
exports.searchCases = async (req, res, next) => {
  try {
    const { query, page = 1, limit = 10 } = req.query

    if (!query) {
      return next(new ErrorResponse("Please provide a search query", 400))
    }

    // Check if result is cached in Redis
    const cacheKey = `search:cases:${query}:${page}:${limit}:${req.user.id}`
    const cachedResult = await redis.get(cacheKey)

    if (cachedResult) {
      return res.status(200).json(JSON.parse(cachedResult))
    }

    const startIndex = (page - 1) * limit

    // Search for cases using MongoDB text search
    // Only return cases that are public or owned by the current user
    const cases = await Case.find({
      $and: [{ $text: { $search: query } }, { $or: [{ isPublic: true }, { user: req.user.id }] }],
    })
      .select("-documents")
      .sort({ score: { $meta: "textScore" } })
      .skip(startIndex)
      .limit(Number.parseInt(limit))

    const total = await Case.countDocuments({
      $and: [{ $text: { $search: query } }, { $or: [{ isPublic: true }, { user: req.user.id }] }],
    })

    const result = {
      success: true,
      count: cases.length,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: cases,
    }

    // Cache the result in Redis for 30 minutes
    await redis.set(cacheKey, JSON.stringify(result), "EX", 1800)

    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

// @desc    Get similar cases based on NLP similarity
// @route   GET /api/search/similar/:id
// @access  Private
exports.getSimilarCases = async (req, res, next) => {
  try {
    const caseItem = await Case.findById(req.params.id)

    if (!caseItem) {
      return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404))
    }

    // Make sure user owns the case or the case is public
    if (!caseItem.isPublic && caseItem.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this case`, 403))
    }

    // Check if result is cached in Redis
    const cacheKey = `similar:cases:${req.params.id}`
    const cachedResult = await redis.get(cacheKey)

    if (cachedResult) {
      return res.status(200).json(JSON.parse(cachedResult))
    }

    // In a real application, this would call an NLP service to find similar cases
    // For this example, we'll simulate finding similar cases based on case type and tags
    const similarCases = await Case.find({
      _id: { $ne: caseItem._id },
      $or: [{ caseType: caseItem.caseType }, { "analysisResults.tags": { $in: caseItem.analysisResults?.tags || [] } }],
      $and: [{ $or: [{ isPublic: true }, { user: req.user.id }] }],
    })
      .select("title description caseType status analysisResults.tags")
      .limit(5)

    const result = {
      success: true,
      count: similarCases.length,
      data: similarCases,
    }

    // Cache the result in Redis for 1 hour
    await redis.set(cacheKey, JSON.stringify(result), "EX", 3600)

    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

