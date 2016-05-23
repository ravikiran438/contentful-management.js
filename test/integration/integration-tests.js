import test from 'blue-tape'
import {localeReadOnlyTests, localeWriteTests} from './locale-integration'
import {contentTypeReadOnlyTests, contentTypeWriteTests} from './content-type-integration'
import {entryReadOnlyTests, entryWriteTests} from './entry-integration'
import {assetReadOnlyTests, assetWriteTests} from './asset-integration'
import generateRandomId from './generate-random-id'
import contentfulManagement from '../../'

const params = {
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN
}

const organization = process.env.CONTENTFUL_ORGANIZATION

if (process.env.API_INTEGRATION_TESTS) {
  params.host = '127.0.0.1:5000'
  params.insecure = true
}

const client = contentfulManagement.createClient(params)

test('Gets spaces', (t) => {
  t.plan(2)
  return client.getSpaces()
  .then((response) => {
    t.ok(response.items, 'items')
    t.ok(response.total > 0, 'items have spaces')
  })
})

test('Gets space', (t) => {
  t.plan(2)
  return client.getSpace('cfexampleapi')
  .then((response) => {
    t.ok(response.sys, 'sys')
    t.ok(response.name, 'name')
  })
})

test('Fails to get space', (t) => {
  t.plan(2)
  return client.getSpace(generateRandomId('weirdrandomid'))
  .then(() => {}, (error) => {
    t.equals(error.name, 'NotFound', 'error name')
    const errorData = JSON.parse(error.message)
    t.equals(errorData.status, 404, 'http status code from parsed error data')
  })
})

test('Creates, updates and deletes a space', (t) => {
  t.plan(2)
  return client.createSpace({
    name: 'spacename'
  }, organization)
  .then((space) => {
    t.equals(space.name, 'spacename')
    space.name = 'updatedspacename'
    return space.update()
    .then((updatedSpace) => {
      t.equals(updatedSpace.name, 'updatedspacename')
      return updatedSpace.delete()
    })
  })
})

test('Gets space for read only tests', (t) => {
  client.getSpace('cfexampleapi')
  .then((space) => {
    localeReadOnlyTests(t, space)
    contentTypeReadOnlyTests(t, space)
    entryReadOnlyTests(t, space)
    assetReadOnlyTests(t, space)
  })
})

test('Create space for tests which create, change and delete data', (t) => {
  return client.createSpace({
    name: 'CMA JS SDK tests'
  }, organization)
  // When running these tests locally, create a specific space, uncomment and
  // use the line below to avoid running into the 10 space per hour creation limit.
  // Also comment the test.onFinish line below to avoid removing the space.
  // The below line also uses double quotes on purpose so it breaks the linter
  // in case someone forgets to comment this line again.
  // client.getSpace("g8uibgoutlhb")
  .then((space) => {
    return space.createLocale({
      name: 'German (Germany)',
      code: 'de-DE'
    })
    .then(() => {
      return space
    })
  })
  .then((space) => {
    localeWriteTests(t, space)
    contentTypeWriteTests(t, space)
    entryWriteTests(t, space)
    assetWriteTests(t, space)
    test.onFinish(() => space.delete())
  })
})
