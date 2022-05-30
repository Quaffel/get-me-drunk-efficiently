import React from 'react';
import { DrinkList } from '../drinks/DrinkList';
import { IDrinkAmount, IIngredient } from "../../../types";
import { Banner } from '../basic/Banner';
import { Spinner } from '../basic/Spinner';
import SearchForm from '../searchform/searchform';
import *  as API from "../api";

function App() {
  const [state, setState] = React.useState<{ pending?: true, loading?: true, result?: IDrinkAmount[], error?: string }>({ pending: true });

  async function startRecommendation(query: { ingredients: IIngredient[], weight: number, promille: number }) {
    setState({ loading: true });

    try {
      // TODO: Replace Array<Ingredient> with Array<Ingredient["name"]> in originating component
      const result = await API.queryTipsinessRecommendation({
        ingredients: query.ingredients.map(it => it.name),
        weight: query.weight,
        promille: query.promille
      });
      setState({ result: result.drinks });
    } catch (error: any) {
      setState({ error: error.message });
    }
  }

  function goBack() {
    setState({pending: true});
  }


  if (state.loading) {
    return (<Spinner />);
  }

  if (state.error) {
    return (<Banner.Warning title="An error occurred" text={state.error} />);
  }

  if (state.pending || !state.result?.length) {
    return (
      <>
        {!!state.result && !state.result.length && <Banner.Warning title="No result found" text="Adapt your query" />}
        <SearchForm submit={startRecommendation} />
      </>
    )
  }

  return (<DrinkList drinkAmounts={state.result} goBack={goBack} />);
}


export default App;
