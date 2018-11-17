import React, { createContext, useContext, Suspense } from 'react'
import { render, cleanup, waitForElement } from 'react-testing-library'
import 'jest-dom/extend-expect'

import Provider from './'
import { resolve } from 'dns';

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  console.error.mockRestore()

})


describe('Provider', () => {
  it('public interface', () => {
    const context = createContext()
    const AssertComponent = props => {
      const consumer = useContext(context)
      const providerInterface = Object.keys(consumer)
      expect(providerInterface).toEqual(['getResource', 'clearCache', 'hit'])

      return 'asserts mounted'
    }

    const providers = (
      <Provider context={context}>
        <AssertComponent />
      </Provider>
    )

    const { container } = render(providers)
    expect(container).toHaveTextContent('asserts mounted')
  })

  it('throw exception for not defined resource', () => {
    const context = createContext()

    const AssertComponent = props => {
      const { getResource } = useContext(context)
      getResource('funcNotExist')()
      return 'test assert'
    }
    
    class AssertErrorComponent extends React.Component {
      constructor (props) {
        super(props)
        this.state = { hasError: false, error: '' }
      }

      static getDerivedStateFromError () {
        return { hasError: true }
      }
      componentDidCatch (error, info) {
        this.setState({ hasError: true, error: error })
      }

      render () {
        return this.state.hasError
          ? (<div data-testid='error'>
            {this.state.error.toString()}
          </div>)
          : this.props.children
      }
    }

    const providers = (
      <AssertErrorComponent>
        <Provider context={context}>
          <AssertComponent />
        </Provider>
      </AssertErrorComponent>
    )

    const { container } = simulateAsyncRender(providers, 3)
    expect(container).toHaveTextContent('Error: Context:Cache:Provider funcNotExist resource is undefined')
  })

  it('resource as function could be a function', async () => {
    const context = createContext()
    const resourceMock = jest.fn(a => a)

    const AssertComponent = props => {
      const { getResource } = useContext(context)
      const passFunc = getResource('passFunc')
      expect(passFunc).toBeTruthy()

      console.log('called function', passFunc('hello'))
      expect(resourceMock).toBeCalledWith('hello')
      expect(resourceMock).toHaveReturned()
      return <span data-testid="comp-result">asserts mounted</span>
    }

    const providers = (
      <Provider context={context} passFunc={resourceMock}>
        <Suspense fallback={'suspense'}>
          <AssertComponent />        
        </Suspense>
      </Provider>
    )

    const { container, getByTestId } = simulateAsyncRender(providers, 2)

    await waitForElement(() =>
      getByTestId('comp-result')
    )
    expect(container).toHaveTextContent('asserts mounted')
  })


  it('resource as function should save result on cache , checking with hit', async () => {
    const context = createContext()

    const resourceMock = jest.fn(a => a)

    const AssertComponent = props => {
      const { getResource, hit } = useContext(context)
      const passFunc = getResource('anotherPassFunc')
      const result = passFunc('hello')
      const hitCache = hit('anotherPassFunc', 'hello')
      return <span data-testid='comp-result'>{hitCache ? 'hit' : 'not hit'} cache and passFunc return {result}</span>
    }

    const providers = (
      <Provider context={context} anotherPassFunc={resourceMock}>
        <Suspense fallback='suspense'>
          <AssertComponent />
        </Suspense>
      </Provider>
    )


    const { getByTestId } = simulateAsyncRender(providers, 2)

    await waitForElement(() =>
      getByTestId('comp-result')
    )
    expect(getByTestId('comp-result').textContent).toBe('hit cache and passFunc return hello')
    // should be call only one time because of cache
    expect(resourceMock.mock.calls.length).toBe(1)
  })


  it('resource as promise should call Suspense', async () => {
    const context = createContext()

    const resourceMockNotResolved = a => new Promise(resolve => resolve('hello'))

    const ComponentNotResolved = props => {
      const { getResource } = useContext(context)
      const passFunc = getResource('resourceMockNotResolved')
      passFunc('hello')

      return 'it is supose not show'
    }

    const providers = (
      <Provider
        context={context}
        resourceMockNotResolved={resourceMockNotResolved}
      >
        <Suspense fallback={'suspense fallback mounted'}>
          <ComponentNotResolved />
        </Suspense>

      </Provider>
    )

    const { container } = simulateAsyncRender(providers, 3)
    expect(container).toHaveTextContent('suspense fallback mounted')
  })

  it('resource as promise resolve Suspense', async () => {
    const context = createContext()

    const resourceMockNotResolved = a => new Promise(resolve => resolve(a + 'result'))

    const Component = props => {
      const { getResource } = useContext(context)
      const passFunc = getResource('resourceMockNotResolved')
      const result = passFunc('hello')
      return <span data-testid="comp-result">resolved with {result}</span>
    }

    const providers = (
      <Provider
        context={context}
        resourceMockNotResolved={resourceMockNotResolved}
      >
        <Suspense fallback={<span  data-testid="suspense-result">suspense fallback mounted</span>}>
          <Component />
        </Suspense>
      </Provider>
    )
    const { getByTestId } = simulateAsyncRender(providers, 3)

    expect(getByTestId('suspense-result')).toHaveTextContent('suspense fallback mounted')

    await waitForElement(() =>
      getByTestId('comp-result')
    )
    expect(getByTestId('comp-result')).toHaveTextContent('resolved with helloresult')
  })

})

function simulateAsyncRender (component, frequency = 2) {
  let lastRender = render(component)
  for (let index = 0; index < frequency - 1; index++) {
    lastRender.rerender(component)
  }
  return lastRender
}
