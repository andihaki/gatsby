const { getFieldsEnum } = require(`./sort`)
const { distinct, group } = require(`../resolvers`)

const getPageInfo = ({ schemaComposer }) =>
  schemaComposer.getOrCreateOTC(`PageInfo`, tc => {
    tc.addFields({
      currentPage: `Int!`,
      hasPreviousPage: `Boolean!`,
      hasNextPage: `Boolean!`,
      itemCount: `Int!`,
      pageCount: `Int!`,
      perPage: `Int`,
    })
  })

const getEdge = ({ schemaComposer, typeComposer }) => {
  const typeName = typeComposer.getTypeName() + `Edge`
  return schemaComposer.getOrCreateOTC(typeName, tc => {
    tc.addFields({
      next: typeComposer,
      node: typeComposer.getTypeNonNull(),
      previous: typeComposer,
    })
  })
}

const createPagination = ({
  schemaComposer,
  typeComposer,
  fields,
  typeName,
}) => {
  const paginationTypeComposer = schemaComposer.getOrCreateOTC(typeName, tc => {
    tc.addFields({
      totalCount: `Int!`,
      edges: [getEdge({ schemaComposer, typeComposer }).getTypeNonNull()],
      nodes: [typeComposer.getTypeNonNull()],
      pageInfo: getPageInfo({ schemaComposer }).getTypeNonNull(),
      ...fields,
    })
  })
  paginationTypeComposer.makeFieldNonNull(`edges`)
  paginationTypeComposer.makeFieldNonNull(`nodes`)
  return paginationTypeComposer
}

const getGroup = ({ schemaComposer, typeComposer }) => {
  const typeName = typeComposer.getTypeName() + `GroupConnection`
  const fields = {
    field: `String!`,
    fieldValue: `String`,
  }
  return createPagination({ schemaComposer, typeComposer, fields, typeName })
}

const getPagination = ({ schemaComposer, typeComposer }) => {
  const inputTypeComposer = typeComposer.getInputTypeComposer()
  const typeName = typeComposer.getTypeName() + `Connection`
  const fieldsEnumTC = getFieldsEnum({
    schemaComposer,
    typeComposer,
    inputTypeComposer,
  })
  const fields = {
    distinct: {
      type: [`String!`],
      args: {
        field: fieldsEnumTC.getTypeNonNull(),
      },
      resolve: distinct,
    },
    group: {
      type: [getGroup({ schemaComposer, typeComposer }).getTypeNonNull()],
      args: {
        skip: `Int`,
        limit: `Int`,
        field: fieldsEnumTC.getTypeNonNull(),
      },
      resolve: group,
    },
  }
  const paginationTypeComposer = createPagination({
    schemaComposer,
    typeComposer,
    fields,
    typeName,
  })
  paginationTypeComposer.makeFieldNonNull(`distinct`)
  paginationTypeComposer.makeFieldNonNull(`group`)
  return paginationTypeComposer
}

module.exports = {
  getPageInfo,
  getEdge,
  getGroup,
  getPagination,
}
