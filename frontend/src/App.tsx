import React from 'react';
import './App.css';
import { DrinkList } from './drinks/DrinkList';
import { IDrinkAmount, IDrink, IIngredient } from "../../types";
import { Banner } from './basic/Banner';
import { Spinner } from './basic/Spinner';
import SearchForm from './searchform/searchform';
import *  as API from "./api";

const drinkAmounts = [
  { 
    drink: { 
      name: "Bloody Mary",
      description: "An english original",
      ingredients: [{ name: "Tomato"}],
      instructions: []
    }, 
    amount: 2 
  },
  { 
    drink: { 
      name: "Kolakorn",
      description: "An english original",
      ingredients: [{ name: "Coca-Cola" }, { name: "Korn" }, { name: "Eis"}],
      instructions: ["Korn und Kola mischen", "Eiswürfel hinzugeben"]
    }, 
    amount: 3 
  }
];

function App() {
  const [state, setState] = React.useState<{ pending?: true, loading?: true, result?: IDrinkAmount[], error?: string  }>({ pending: true });

  async function startRecommendation(query: { ingredients: IIngredient[], weight: number, promille: number }) {
    setState({ loading: true });

    try {
      const result = await API.getMeDrunk(query);
      setState({ result: result.drinks });
    } catch(error) {
      setState({ error: error.message });
    }
  }


  if(state.loading) {
    return (
      <Container>
        <Spinner />
      </Container>
    );
  }

  if(state.error) {
    return (
      <Container>
        <Banner.Warning title="An error occurred" text={state.error} />
      </Container>
    )
  }

  if(state.pending || !state.result?.length) {
    return (
      <Container>
        {!!state.result && !state.result.length && <Banner.Warning title="No result found" text="Adapt your query" />}
        <SearchForm submit={startRecommendation} />
      </Container>
    )
  }

  return (
    <Container>
      <DrinkList drinkAmounts={state.result} />
    </Container>
  );
}

function Container({ children }: React.PropsWithChildren<{}>) {
  return <div className="app">
    <div className="app-title">Get me drunk</div>
    {children}
  </div>
}


export default App;
