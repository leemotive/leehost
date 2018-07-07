<template lang="pug">
    .host-header
        .header-wrap
            .host-name {{host.name}}
            .host-extends {{extendsHost}}
</template>

<script>
export default {
    components: {

    },
    props: {
        host: {
            type: Object,
            default: () => ({}),
        },

    },
    computed: {
        extendsHost() {
            return this.host.extendNames ? `${this.host.ip} extends from Host Names` : '';
        }
    }
}
</script>


<style lang="postcss" scoped>
    .host-header {
        background-color: #f7f7f7;
        padding-left: 29px;

        .header-wrap {
            border-left: 1px solid #ddd;
            background-color: #fff;
            padding-left: 5px;
            padding-bottom: 5px;
        }

        .host-name {
            color: #358dea;
            font-size: 18px;
        }

        .host-extends {
            color: #669fdc;
            font-size: 14px;
        }
    }
</style>
