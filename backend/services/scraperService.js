import axios from 'axios'
import * as cheerio from 'cheerio'
import { extractLeetCodeSlug } from '../utils/helpers.js'

export const scrapeLeetCodeProblem = async (url) => {
  try {
    const slug = extractLeetCodeSlug(url)
    
    if (!slug) {
      throw new Error('Invalid LeetCode URL')
    }

    // LeetCode GraphQL API endpoint
    const graphqlEndpoint = 'https://leetcode.com/graphql'

    const query = `
      query getProblem($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          title
          titleSlug
          content
          difficulty
          likes
          dislikes
          topicTags {
            name
            slug
          }
          companyTagStats
          codeSnippets {
            lang
            langSlug
            code
          }
          sampleTestCase
          exampleTestcases
          hints
          similarQuestions
        }
      }
    `

    const response = await axios.post(
      graphqlEndpoint,
      {
        query,
        variables: { titleSlug: slug },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://leetcode.com/',
        },
        timeout: 10000,
      }
    )

    const questionData = response.data?.data?.question

    if (!questionData) {
      throw new Error('Problem not found')
    }

    // Parse HTML content to extract description and examples
    const $ = cheerio.load(questionData.content)
    
    // Extract clean description
    const description = $('body').text().trim()
    
    // Extract examples with better parsing
    const examples = []
    $('pre').each((i, elem) => {
      const text = $(elem).text().trim()
      if (text && i < 5) { // Limit to first 5 examples
        examples.push({
          input: text,
          output: '',
          explanation: '',
        })
      }
    })

    // Extract constraints
    const constraints = []
    $('ul li, p').each((i, elem) => {
      const text = $(elem).text().trim()
      if (text.includes('<=') || text.includes('≤') || text.match(/\d+\s*[<>]=?\s*\d+/)) {
        constraints.push(text)
      }
    })

    // Parse company tags
    let companies = []
    try {
      if (questionData.companyTagStats) {
        const companyData = JSON.parse(questionData.companyTagStats)
        companies = companyData.slice(0, 10).map(c => c.name)
      }
    } catch (e) {
      console.log('Could not parse company tags')
    }

    // Parse similar questions
    let similarProblems = []
    try {
      if (questionData.similarQuestions) {
        similarProblems = JSON.parse(questionData.similarQuestions).map(q => ({
          title: q.title,
          titleSlug: q.titleSlug,
          difficulty: q.difficulty,
        }))
      }
    } catch (e) {
      console.log('Could not parse similar questions')
    }

    return {
      leetcodeId: questionData.questionId,
      title: questionData.title,
      slug: questionData.titleSlug,
      difficulty: questionData.difficulty,
      description,
      examples: examples.slice(0, 3),
      constraints: constraints.slice(0, 10),
      tags: questionData.topicTags.map(tag => tag.name),
      likes: questionData.likes,
      dislikes: questionData.dislikes,
      companies,
      hints: questionData.hints || [],
      similarProblems,
      codeTemplates: questionData.codeSnippets || [],
    }
  } catch (error) {
    console.error('Error scraping LeetCode problem:', error.message)
    
    // Fallback: return basic structure
    return {
      title: 'Problem from ' + url,
      description: 'Unable to scrape problem. Please provide problem statement manually.',
      examples: [],
      constraints: [],
      difficulty: 'Medium',
      tags: [],
      companies: [],
    }
  }
}

export const fetchLeetCodeProblemsList = async (filters = {}) => {
  try {
    const { difficulty, tags, limit = 50 } = filters

    const query = `
      query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          total: totalNum
          questions: data {
            acRate
            difficulty
            freqBar
            frontendQuestionId: questionFrontendId
            isFavor
            paidOnly: isPaidOnly
            status
            title
            titleSlug
            topicTags {
              name
              slug
            }
          }
        }
      }
    `

    const variables = {
      categorySlug: '',
      limit,
      skip: 0,
      filters: {
        ...(difficulty && { difficulty }),
        ...(tags && { tags }),
      },
    }

    const response = await axios.post(
      'https://leetcode.com/graphql',
      { query, variables },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data.data.problemsetQuestionList.questions
  } catch (error) {
    console.error('Error fetching LeetCode problems list:', error)
    return []
  }
}

export default {
  scrapeLeetCodeProblem,
  fetchLeetCodeProblemsList,
}
