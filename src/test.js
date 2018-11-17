import React, { createContext, useContext, Suspense } from 'react'
import { render, cleanup } from 'react-testing-library'
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

      return null
    }

    const providers = (
      <Provider context={context}>
        <AssertComponent />
      </Provider>
    )

    render(providers)
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

  it('resource as function should called', () => {
    const context = createContext()
    const resourceMock = jest.fn()

    const AssertComponent = props => {
      const { getResource } = useContext(context)
      const passFunc = getResource('passFunc')
      expect(passFunc).toBeTruthy()

      passFunc('hello')
      expect(resourceMock).toBeCalledWith('hello')
      expect(resourceMock).toHaveReturned()
      return null
    }

    const providers = (
      <Provider context={context} passFunc={resourceMock}>
        <AssertComponent />
      </Provider>
    )

    render(providers)
  })


  it('resource as function should save result on cache', () => {
    const context = createContext()

    const resourceMock = jest.fn(a => a)

    const AssertComponent = props => {
      const { getResource } = useContext(context)
      const passFunc = getResource('anotherPassFunc')
      expect(passFunc).toBeTruthy()
      const result = passFunc('hello')
      return <span data-testid='result'>{result}</span>
    }

    const providers = (
      <Provider context={context} anotherPassFunc={resourceMock}>
        <AssertComponent />
      </Provider>
    )

    const { getByText } = simulateAsyncRender(providers, 2)
    expect(getByText('hello').textContent).toBe('hello')
    // should be call only one time because of cache
    expect(resourceMock.mock.calls.length).toBe(1)
  })

  it('resource as promise should call Suspense', () => {
    const context = createContext()

    const resourceMockNotResolved = jest.fn(a => new Promise(resolve => null))

    const ComponentNotResolved = props => {
      const { getResource } = useContext(context)
      const passFunc = getResource('resourceMockNotResolved')
      expect(passFunc).toBeTruthy()
      passFunc('hello')
      return null
    }
    
    const AssertSuspenseNotResolved = () => {
      expect(true).toBeTruthy()
      return null
    }

    const providers = (
      <Suspense fallback={AssertSuspenseNotResolved}>
        <Provider
          context={context}
          resourceMockNotResolved={resourceMockNotResolved}
        >
          <ComponentNotResolved />
        </Provider>
      </Suspense>
    )
    simulateAsyncRender(providers, 2)
  })
})

function simulateAsyncRender (component, frequency = 2) {
  let lastRender = render(component)
  for (let index = 0; index < frequency - 1; index++) {
    lastRender.rerender(component)
  }
  return lastRender
}
