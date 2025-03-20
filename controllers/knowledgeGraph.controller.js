const KnowledgeGraph = require("../models/KnowledgeGraph.model")
const Case = require("../models/Case.model")
const ErrorResponse = require("../utils/errorResponse")
const axios = require("axios")

// @desc    Generate knowledge graph
// @route   POST /api/knowledge-graph/generate
// @access  Private
exports.generateKnowledgeGraph = async (req, res, next) => {
  try {
    const { title, description, category, caseId } = req.body

    // Validate input
    if (!title) {
      return next(new ErrorResponse("Please provide a title for the knowledge graph", 400))
    }

    let relatedCase = null
    let graphData = null

    // If caseId is provided, fetch the case and generate graph based on it
    if (caseId) {
      relatedCase = await Case.findById(caseId)

      if (!relatedCase) {
        return next(new ErrorResponse(`Case not found with id of ${caseId}`, 404))
      }

      // Make sure user owns the case or the case is public
      if (!relatedCase.isPublic && relatedCase.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this case`, 403))
      }

      // In a real application, this would call an NLP service to generate the graph
      // For this example, we'll simulate generating a graph based on the case data
      graphData = generateGraphFromCase(relatedCase)
    } else {
      // Generate a generic legal concept graph
      graphData = generateGenericLegalGraph(category)
    }

    // Create the knowledge graph
    const knowledgeGraph = await KnowledgeGraph.create({
      title,
      description: description || `Knowledge graph for ${title}`,
      nodes: graphData.nodes,
      edges: graphData.edges,
      category: category || "Legal Concept",
      isPublic: req.body.isPublic || true,
      creator: req.user.id,
      relatedCase: relatedCase ? relatedCase._id : null,
    })

    res.status(201).json({
      success: true,
      data: knowledgeGraph,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get knowledge graph
// @route   GET /api/knowledge-graph/:id
// @access  Public/Private (depends on isPublic flag)
exports.getKnowledgeGraph = async (req, res, next) => {
  try {
    const knowledgeGraph = await KnowledgeGraph.findById(req.params.id)

    if (!knowledgeGraph) {
      return next(new ErrorResponse(`Knowledge graph not found with id of ${req.params.id}`, 404))
    }

    // Check if the graph is private and if the user is authorized to view it
    if (!knowledgeGraph.isPublic) {
      // Check if user is logged in
      if (!req.user) {
        return next(new ErrorResponse("Not authorized to access this knowledge graph", 401))
      }

      // Check if user is the creator or an admin
      if (knowledgeGraph.creator.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this knowledge graph`, 403))
      }
    }

    res.status(200).json({
      success: true,
      data: knowledgeGraph,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get all public knowledge graphs
// @route   GET /api/knowledge-graph
// @access  Public
exports.getPublicKnowledgeGraphs = async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1
    const limit = Number.parseInt(req.query.limit, 10) || 10
    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    // Build query
    const query = { isPublic: true }

    // Apply category filter if provided
    if (req.query.category) {
      query.category = req.query.category
    }

    const total = await KnowledgeGraph.countDocuments(query)
    const knowledgeGraphs = await KnowledgeGraph.find(query).sort({ createdAt: -1 }).skip(startIndex).limit(limit)

    // Pagination result
    const pagination = {}

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      }
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      }
    }

    res.status(200).json({
      success: true,
      count: knowledgeGraphs.length,
      pagination,
      data: knowledgeGraphs,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get user's knowledge graphs
// @route   GET /api/knowledge-graph/user
// @access  Private
exports.getUserKnowledgeGraphs = async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1
    const limit = Number.parseInt(req.query.limit, 10) || 10
    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    // Get knowledge graphs created by the logged-in user
    const query = { creator: req.user.id }

    // Apply category filter if provided
    if (req.query.category) {
      query.category = req.query.category
    }

    const total = await KnowledgeGraph.countDocuments(query)
    const knowledgeGraphs = await KnowledgeGraph.find(query).sort({ createdAt: -1 }).skip(startIndex).limit(limit)

    // Pagination result
    const pagination = {}

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      }
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      }
    }

    res.status(200).json({
      success: true,
      count: knowledgeGraphs.length,
      pagination,
      data: knowledgeGraphs,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Update knowledge graph
// @route   PUT /api/knowledge-graph/:id
// @access  Private
exports.updateKnowledgeGraph = async (req, res, next) => {
  try {
    let knowledgeGraph = await KnowledgeGraph.findById(req.params.id)

    if (!knowledgeGraph) {
      return next(new ErrorResponse(`Knowledge graph not found with id of ${req.params.id}`, 404))
    }

    // Make sure user is the creator or an admin
    if (knowledgeGraph.creator.toString() !== req.user.id && req.user.role !== "admin") {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this knowledge graph`, 403))
    }

    // Update fields
    const fieldsToUpdate = {
      title: req.body.title || knowledgeGraph.title,
      description: req.body.description || knowledgeGraph.description,
      isPublic: req.body.isPublic !== undefined ? req.body.isPublic : knowledgeGraph.isPublic,
    }

    // Update nodes and edges if provided
    if (req.body.nodes) {
      fieldsToUpdate.nodes = req.body.nodes
    }

    if (req.body.edges) {
      fieldsToUpdate.edges = req.body.edges
    }

    knowledgeGraph = await KnowledgeGraph.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      data: knowledgeGraph,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Delete knowledge graph
// @route   DELETE /api/knowledge-graph/:id
// @access  Private
exports.deleteKnowledgeGraph = async (req, res, next) => {
  try {
    const knowledgeGraph = await KnowledgeGraph.findById(req.params.id)

    if (!knowledgeGraph) {
      return next(new ErrorResponse(`Knowledge graph not found with id of ${req.params.id}`, 404))
    }

    // Make sure user is the creator or an admin
    if (knowledgeGraph.creator.toString() !== req.user.id && req.user.role !== "admin") {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this knowledge graph`, 403))
    }

    await knowledgeGraph.remove()

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (err) {
    next(err)
  }
}

// Helper function to generate graph from case
const generateGraphFromCase = (caseItem) => {
  // In a real application, this would use NLP to extract entities and relationships
  // For this example, we'll create a simple graph based on the case data

  const nodes = [
    {
      id: `case-${caseItem._id}`,
      label: caseItem.title,
      group: "case",
      description: caseItem.description,
      size: 15,
    },
  ]

  const edges = []

  // Add nodes for case type
  nodes.push({
    id: `type-${caseItem.caseType}`,
    label: caseItem.caseType,
    group: "caseType",
    description: `Case type: ${caseItem.caseType}`,
    size: 10,
  })

  edges.push({
    source: `case-${caseItem._id}`,
    target: `type-${caseItem.caseType}`,
    label: "has type",
    weight: 1,
  })

  // Add nodes for relevant laws if available
  if (caseItem.analysisResults && caseItem.analysisResults.relevantLaws) {
    caseItem.analysisResults.relevantLaws.forEach((law, index) => {
      nodes.push({
        id: `law-${index}`,
        label: law.name,
        group: "law",
        description: law.description,
        size: 10,
      })

      edges.push({
        source: `case-${caseItem._id}`,
        target: `law-${index}`,
        label: "references",
        weight: law.relevance * 2,
      })
    })
  }

  // Add nodes for tags if available
  if (caseItem.analysisResults && caseItem.analysisResults.tags) {
    caseItem.analysisResults.tags.forEach((tag, index) => {
      nodes.push({
        id: `tag-${tag}`,
        label: tag,
        group: "tag",
        description: `Tag: ${tag}`,
        size: 8,
      })

      edges.push({
        source: `case-${caseItem._id}`,
        target: `tag-${tag}`,
        label: "tagged as",
        weight: 1,
      })
    })
  }

  return { nodes, edges }
}

// Helper function to generate a generic legal graph
const generateGenericLegalGraph = (category) => {
  let nodes = []
  let edges = []

  switch (category) {
    case "Criminal Law":
      nodes = [
        {
          id: "criminal-law",
          label: "Criminal Law",
          group: "main",
          description: "Body of law that defines criminal offenses and their punishments",
          size: 15,
        },
        {
          id: "mens-rea",
          label: "Mens Rea",
          group: "concept",
          description: "The mental element of a crime; guilty mind",
          size: 10,
        },
        {
          id: "actus-reus",
          label: "Actus Reus",
          group: "concept",
          description: "The physical element of a crime; guilty act",
          size: 10,
        },
        {
          id: "punishment",
          label: "Punishment",
          group: "concept",
          description: "Legal penalties imposed for criminal behavior",
          size: 10,
        },
        {
          id: "ipc",
          label: "Indian Penal Code",
          group: "statute",
          description: "The main criminal code of India",
          size: 12,
        },
      ]

      edges = [
        { source: "criminal-law", target: "mens-rea", label: "requires", weight: 2 },
        { source: "criminal-law", target: "actus-reus", label: "requires", weight: 2 },
        { source: "criminal-law", target: "punishment", label: "imposes", weight: 1.5 },
        { source: "criminal-law", target: "ipc", label: "codified in", weight: 1 },
        { source: "mens-rea", target: "actus-reus", label: "combined with", weight: 1 },
      ]
      break

    case "Constitutional Law":
      nodes = [
        {
          id: "constitutional-law",
          label: "Constitutional Law",
          group: "main",
          description: "Body of law defining the relationship of different entities within a state",
          size: 15,
        },
        {
          id: "fundamental-rights",
          label: "Fundamental Rights",
          group: "concept",
          description: "Basic rights guaranteed to all citizens",
          size: 12,
        },
        {
          id: "directive-principles",
          label: "Directive Principles",
          group: "concept",
          description: "Guidelines for the government to frame laws",
          size: 10,
        },
        {
          id: "separation-powers",
          label: "Separation of Powers",
          group: "concept",
          description: "Division of government responsibilities",
          size: 10,
        },
        {
          id: "judicial-review",
          label: "Judicial Review",
          group: "concept",
          description: "Power of courts to examine legislative and executive acts",
          size: 10,
        },
      ]

      edges = [
        { source: "constitutional-law", target: "fundamental-rights", label: "guarantees", weight: 2 },
        { source: "constitutional-law", target: "directive-principles", label: "includes", weight: 1.5 },
        { source: "constitutional-law", target: "separation-powers", label: "establishes", weight: 1.5 },
        { source: "constitutional-law", target: "judicial-review", label: "provides for", weight: 1.5 },
        { source: "fundamental-rights", target: "judicial-review", label: "enforced through", weight: 1 },
      ]
      break

    case "Contract Law":
      nodes = [
        {
          id: "contract-law",
          label: "Contract Law",
          group: "main",
          description: "Body of law that governs making and enforcing agreements",
          size: 15,
        },
        {
          id: "offer",
          label: "Offer",
          group: "concept",
          description: "A promise that is dependent on a requested act, forbearance, or return promise",
          size: 10,
        },
        {
          id: "acceptance",
          label: "Acceptance",
          group: "concept",
          description: "Agreement to the terms of an offer",
          size: 10,
        },
        {
          id: "consideration",
          label: "Consideration",
          group: "concept",
          description: "Something of value exchanged for a promise",
          size: 10,
        },
        {
          id: "breach",
          label: "Breach of Contract",
          group: "concept",
          description: "Violation of a contractual obligation",
          size: 10,
        },
      ]

      edges = [
        { source: "contract-law", target: "offer", label: "requires", weight: 2 },
        { source: "contract-law", target: "acceptance", label: "requires", weight: 2 },
        { source: "contract-law", target: "consideration", label: "requires", weight: 2 },
        { source: "contract-law", target: "breach", label: "addresses", weight: 1.5 },
        { source: "offer", target: "acceptance", label: "followed by", weight: 1 },
      ]
      break

    default:
      // Default to a general legal system graph
      nodes = [
        {
          id: "legal-system",
          label: "Legal System",
          group: "main",
          description: "Framework of laws, institutions, and processes",
          size: 15,
        },
        {
          id: "criminal-law",
          label: "Criminal Law",
          group: "branch",
          description: "Body of law that defines criminal offenses",
          size: 12,
        },
        {
          id: "civil-law",
          label: "Civil Law",
          group: "branch",
          description: "Body of law dealing with private rights",
          size: 12,
        },
        {
          id: "constitutional-law",
          label: "Constitutional Law",
          group: "branch",
          description: "Body of law defining state relationships",
          size: 12,
        },
        {
          id: "judiciary",
          label: "Judiciary",
          group: "institution",
          description: "System of courts that interprets and applies the law",
          size: 10,
        },
        {
          id: "legislature",
          label: "Legislature",
          group: "institution",
          description: "Body responsible for making laws",
          size: 10,
        },
      ]

      edges = [
        { source: "legal-system", target: "criminal-law", label: "includes", weight: 1.5 },
        { source: "legal-system", target: "civil-law", label: "includes", weight: 1.5 },
        { source: "legal-system", target: "constitutional-law", label: "includes", weight: 1.5 },
        { source: "legal-system", target: "judiciary", label: "operates through", weight: 1 },
        { source: "legal-system", target: "legislature", label: "operates through", weight: 1 },
        { source: "judiciary", target: "criminal-law", label: "applies", weight: 0.5 },
        { source: "judiciary", target: "civil-law", label: "applies", weight: 0.5 },
        { source: "legislature", target: "criminal-law", label: "creates", weight: 0.5 },
        { source: "legislature", target: "civil-law", label: "creates", weight: 0.5 },
      ]
  }

  return { nodes, edges }
}

