import React, { createContext, useContext, Suspense } from 'react'
import { render, cleanup } from 'react-testing-library'
import 'jest-dom/extend-expect'

import Provider from './'

afterEach(cleanup)

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
      getResource('passFunc')()
      return 'test assert'
    }
    class AssertErrorComponent extends React.Component {
      constructor (props) {
        super(props)
        this.state = { hasError: false }
      }

      static getDerivedStateFromError () {
        return { hasError: true }
      }
      componentDidCatch (error, info) {
        this.setState({ hasError: true })
      }

      render () {
        return this.state.hasError
          ? <div data-testid='error'>
              Error
            </div>
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

    const { getByTestId, container } = simulateAsyncRender(providers, 3)
    expect(container).toHaveTextContent('There was a problem')
    // const { getByText } = simulateAsyncRender(providers, 3)
    // expect(getByText('test assert')).toBeTruthy()
    expect(getByTestId('error')).toBeDisabled()
  })

  it('resource as function should called', () => {
    const context = createContext()
    const AssertComponent = props => {
      const { getResource } = useContext(context)
      const passFunc = getResource('passFunc')
      expect(passFunc).toBeTruthy()

      passFunc('hello')
      expect(resourceMock).toBeCalledWith('hello')
      expect(resourceMock).toHaveReturned()
      return null
    }

    const resourceMock = jest.fn()

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
      const passFunc = getResource('passFunc2')
      expect(passFunc).toBeTruthy()
      const result = passFunc('hello')
      return <span data-testid='result'>{result}</span>
    }

    const providers = (
      <Provider context={context} passFunc2={resourceMock}>
        <AssertComponent />
      </Provider>
    )

    const { getByText } = simulateAsyncRender(providers, 2)
    expect(getByText('hello').textContent).toBe('hello')
    // should be call only one time because of cache
    expect(resourceMock.mock.calls.length).toBe(1)
  })

  // it('resource as promise should Suspense', () => {
  //   const context = createContext()

  //   const resourceMockResolved = jest.fn(
  //     a => new Promise(resolve => resolve(a))
  //   )
  //   const resourceMockNotResolved = jest.fn(a => new Promise())

  //   const AssertComponentNotResolved = props => {
  //     const { getResource } = useContext(context)
  //     const passFunc = getResource('promiseResource')
  //     expect(passFunc).toBeTruthy()
  //     passFunc('hello')
  //     return null
  //   }
  //   const AssertSuspenseResolved = () => {
  //     expect(true).toBeTruthy()
  //     return null
  //   }
  //   const AssertSuspenseNotResolved = () => {
  //     expect(true).toBeTruthy()
  //     return null
  //   }

  //   const providers = (
  //     <Suspense fallback={AssertSuspenseResolved}>
  //       <Provider
  //         context={context}
  //         resourceMockNotResolved={resourceMockNotResolved}
  //       >
  //         <AssertComponentNotResolved />
  //       </Provider>
  //     </Suspense>
  //   )
  //   simulateAsyncRender(providers, 2)
  // })
})
function simulateAsyncRender (component, frequency = 2) {
  let lastRender = render(component)
  for (let index = 0; index < frequency - 1; index++) {
    lastRender.rerender(component)
  }
  return lastRender
}
